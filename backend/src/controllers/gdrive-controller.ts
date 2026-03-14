import { google } from "googleapis";
import fs from "fs";
import { db } from "@/db/index.ts";
import { Evidences, EvidenceCriteria, Criteria } from "@/db/schema.ts";
import { eq, inArray } from "drizzle-orm";

import { User } from "@/db/schema.ts";

import mime from "mime-types";
import { streamToBuffer } from "../utils/streamToBuffer.js";
import { extractJwtFromCookies, verifyJwtToken } from "@/utils/cookie-util.ts";
import path from "path";
import type { Context } from "hono";
import * as fsp from "fs/promises";
import { logUserAction } from "@/utils/logger-util.ts";

const folderId = process.env.GDRIVE_FOLDER!;
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
console.log("FolderId: ", folderId);
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

export const uploadFileToDrive = async (
  filePath: string,
  folderId: string,
  userEmail: string,
  userId: number,
  expiryDate: Date
) => {
  try {
    const fileName = filePath.split("/").pop();
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, mimeType, webViewLink",
      supportsAllDrives: true,
    });

    const fileId = file.data.id;
    const webViewLink = file.data.webViewLink;

    if (!fileId) throw new Error("File upload failed");

    // 1. Publikasi file agar bisa diakses semua orang
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
      sendNotificationEmail: false,
      supportsAllDrives: true,
    });

    // 2. Beri akses ke user sebagai editor (karena role: "owner" tidak bisa dipakai antar domain umum)
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "user",
        role: "writer", // Gunakan "writer" karena "owner" dibatasi
        emailAddress: userEmail,
      },
      sendNotificationEmail: false,
      supportsAllDrives: true,
    });

    // 3. Simpan info ke database
    await db.insert(Evidences).values({
      file_name: fileName!,
      file_path:
        webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
      drive_file_id: fileId,
      uploaded_by: userId,
      uploaded_at: new Date(),
      expired_by: expiryDate,
      notified: false, // Initialize the notified field to false for new evidence
    });

    return {
      id: fileId,
      fileId: fileId,
      file_name: fileName,
      file_path:
        webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
      uploaded_at: new Date(),
      uploaded_by: userId,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file and set permissions");
  }
};

export const handleFileList = async (c: Context) => {
  try {
    const query = c.req.query("query") || "";
    const startDate = c.req.query("startDate") || undefined;
    const endDate = c.req.query("endDate") || undefined;
    const extension = c.req.query("extension") || undefined;

    // Pagination parameters
    const pageSize = parseInt(c.req.query("pageSize") || "5", 10);
    const pageToken = c.req.query("pageToken") || undefined;

    const skipPermissions = c.req.query("skipPermissions") === "true";

    const result = await getFilesFromDrive(
      folderId!,
      query,
      startDate,
      endDate,
      extension,
      pageSize,
      pageToken,
      skipPermissions
    );

    const driveIds: string[] = result.files
      .map((f) => f.id)
      .filter((id): id is string => typeof id === "string");

    // console.log("Drive IDs to query DB:", driveIds);

    const filesFromDb = await db.query.Evidences.findMany({
      where: inArray(Evidences.drive_file_id, driveIds),
    });

    // console.log("Files from DB:", filesFromDb);

    const dbFileMap = new Map(
      filesFromDb.map((file) => [file.drive_file_id, file.expired_by])
    );

    const enrichedFiles = result.files.map((file) => ({
      ...file,
      expiryDate: dbFileMap.get(file.id) ?? null,
    }));

    return c.json(
      {
        ...result,
        files: enrichedFiles,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching files:", error);
    return c.json({ error: "Failed to fetch files" }, 500);
  }
};

/**
 * Get files from Google Drive with optimized performance
 *
 * @param folderId - The Google Drive folder ID to search in
 * @param query - Optional search query
 * @param startDate - Optional filter for created after this date
 * @param endDate - Optional filter for created before this date
 * @param extension - Optional filter by file extension
 * @param pageSize - Number of results per page
 * @param pageToken - Token for pagination
 * @param skipPermissions - Set to true to skip fetching permissions data (much faster)
 * @returns Object containing files array and pagination info
 */
export const getFilesFromDrive = async (
  folderId: string,
  query: string = "",
  startDate?: string,
  endDate?: string,
  extension?: string,
  pageSize: number = 5,
  pageToken?: string,
  skipPermissions: boolean = false
) => {
  let q = [`'${folderId}' in parents`, "trashed=false"];

  if (query) {
    q.push(`name contains '${query}'`);
  }

  if (startDate && endDate) {
    q.push(
      `createdTime >= '${startDate}T00:00:00' and createdTime <= '${endDate}T23:59:59'`
    );
  }

  if (extension) {
    q.push(`name contains '.${extension}'`);
  }

  const response = await drive.files.list({
    q: q.join(" and "),
    fields:
      "nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, createdTime, permissions, shared)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    includePermissionsForView: "published",
    pageSize: pageSize,
    pageToken: pageToken || "",
  });

  const files = response.data.files ?? [];
  const nextPageToken = response.data.nextPageToken || null;

  // If skipPermissions is true, return basic file info without permission details
  if (skipPermissions) {
    const result = files.map((file) => ({
      id: file.id,
      name: file.name ?? "Unknown File",
      mimeType: file.mimeType ?? "unknown",
      webViewLink: file.webViewLink ?? "",
      webContentLink: file.webContentLink ?? "",
      createdTime: file.createdTime ?? new Date().toISOString(),
      extension: file.name?.split(".").pop() ?? "unknown",
      access: {
        isPublic: false,
        accessType: "Unknown (permissions not fetched)",
        emailsWithAccess: [],
        domainsWithAccess: [],
        totalPermissionsCount: 0,
      },
    }));

    return {
      files: result,
      nextPageToken: nextPageToken,
      totalCount: result.length,
      hasNextPage: !!nextPageToken,
    };
  }

  // Process all permission requests in parallel instead of sequentially
  const filePermissionPromises = files.map(async (file) => {
    try {
      const permissionsRes = await drive.permissions.list({
        fileId: file.id!,
        fields: "permissions(id,type,role,emailAddress,domain)",
        pageSize: 100, // Increase page size for permissions to reduce API calls
        supportsAllDrives: true,
      });

      const permissions = permissionsRes.data.permissions ?? [];

      const isPublic = permissions.some((p) => p.type === "anyone");

      const emailsWithAccess = permissions
        .filter((p) => p.emailAddress)
        .map((p) => ({
          email: p.emailAddress,
          role: p.role,
        }));

      const domainsWithAccess = permissions
        .filter((p) => p.domain)
        .map((p) => ({
          domain: p.domain,
          role: p.role,
        }));

      return {
        id: file.id,
        name: file.name ?? "Unknown File",
        mimeType: file.mimeType ?? "unknown",
        webViewLink: file.webViewLink ?? "",
        webContentLink: file.webContentLink ?? "",
        createdTime: file.createdTime ?? new Date().toISOString(),
        extension: file.name?.split(".").pop() ?? "unknown",
        access: {
          isPublic,
          accessType: isPublic ? "Anyone with the link" : "Restricted",
          emailsWithAccess,
          domainsWithAccess,
          totalPermissionsCount: permissions.length,
        },
      };
    } catch (error) {
      console.error(`Error getting permissions for file ${file.id}:`, error);
      return {
        id: file.id,
        name: file.name ?? "Unknown File",
        mimeType: file.mimeType ?? "unknown",
        webViewLink: file.webViewLink ?? "",
        webContentLink: file.webContentLink ?? "",
        createdTime: file.createdTime ?? new Date().toISOString(),
        extension: file.name?.split(".").pop() ?? "unknown",
        access: {
          isPublic: false,
          accessType: "Unknown",
          emailsWithAccess: [],
          domainsWithAccess: [],
          totalPermissionsCount: 0,
          error: "Failed to fetch permissions",
        },
      };
    }
  });

  // Wait for all permission requests to complete in parallel
  const result = await Promise.all(filePermissionPromises);

  return {
    files: result,
    nextPageToken: nextPageToken,
    totalCount: result.length,
    hasNextPage: !!nextPageToken,
  };
};

export const handleFileUpload = async (c: Context) => {
  try {
    // Parse body with increased size limit (100MB)
    const body = await c.req.parseBody({
      sizeLimit: '100mb' // Set size limit to 100MB
    });
    const file = body.file as File;

    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    const userId = decoded.id as number;
    const userEmail = decoded.email as string;
    const now = new Date();

    if (!file) return c.json({ error: "File is missing" }, 400);

    // Check file size (100MB limit)
    const fileSize = file.size;
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    if (fileSize > MAX_FILE_SIZE) {
      return c.json({ 
        error: `File size exceeds the limit of 100MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB.` 
      }, 413); // 413 Payload Too Large
    }

    let expiryDate: Date;
    if (body.expiryDate) {
      expiryDate = new Date(body.expiryDate as string);
      if (expiryDate < now) {
        return c.json({ error: "Expiry date cannot be in the past" }, 400);
      }
    } else {
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const tempFilePath = path.join("/tmp", file.name);
    const buffer = await streamToBuffer(file.stream());
    await fsp.writeFile(tempFilePath, buffer);

    const { id, file_name, file_path, uploaded_at, uploaded_by } =
      await uploadFileToDrive(
        tempFilePath,
        folderId,
        userEmail,
        userId,
        expiryDate
      );
    await fsp.unlink(tempFilePath);

    await logUserAction(
      userId,
      userEmail,
      `User ${userEmail} Uploaded Evidence ${file.name}`
    );
    return c.json(
      { fileId: id, id, file_name, file_path, uploaded_at, uploaded_by },
      200
    );
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const handleFileDelete = async (c: Context) => {
  try {
    const fileId = c.req.query("fileId");
    if (!fileId) return c.json({ error: "File ID is required" }, 400);

    // Delete file from Google Drive
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // const user = c.get("users");
    // Start transaction
    await db.transaction(async (tx) => {
      // Get evidence.id by drive_file_id
      const evidence = await tx.query.Evidences.findFirst({
        where: eq(Evidences.drive_file_id, fileId),
      });

      if (!evidence) {
        throw new Error("Evidence not found in database.");
      }

      const relatedCriteria = await tx
        .select({ name: Criteria.name })
        .from(EvidenceCriteria)
        .innerJoin(Criteria, eq(EvidenceCriteria.criteria_id, Criteria.id))
        .where(eq(EvidenceCriteria.evidence_id, evidence.id));

      const criteriaList =
        relatedCriteria.map((c) => c.name).join(", ") || "None";

      // Delete from evidence_criteria
      await tx
        .delete(EvidenceCriteria)
        .where(eq(EvidenceCriteria.evidence_id, evidence.id));

      // Delete from evidences
      await tx.delete(Evidences).where(eq(Evidences.id, evidence.id));
      const userId = decoded.id as number;
      const userEmail = decoded.email as string;
      await logUserAction(
        userId,
        userEmail,
        `User ${userEmail} Deleted Evidence ${evidence.file_name} from Criteria ${criteriaList}`
      );
    });

    // log

    return c.json({ success: true, message: "File deleted successfully" }, 200);
  } catch (error) {
    console.error("Delete error:", error);
    return c.json({ error: "Failed to delete file" }, 500);
  }
};

export const grantAccessByRole = async (c: Context) => {
  try {
    const { fileId, role } = await c.req.json();

    if (!fileId || !role) {
      return c.json({ error: "Missing fileId or role" }, 400);
    }

    const users = await db
      .select({ email: User.email })
      .from(User)
      .where(eq(User.role, role));

    if (!users || users.length === 0) {
      return c.json({ error: `No users found with role: ${role}` }, 404);
    }

    const grantResults = [];

    for (const user of users) {
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            type: "user",
            role: "reader",
            emailAddress: user.email,
          },
          sendNotificationEmail: false, // Add this to disable email notifications
          supportsAllDrives: true,
        });

        grantResults.push({ email: user.email, success: true });
      } catch (err) {
        console.error(`Failed to grant access to ${user.email}`, err);
        grantResults.push({
          email: user.email,
          success: false,
          error: String(err),
        });
      }
    }

    return c.json(
      {
        message: `Permissions updated for role '${role}'`,
        results: grantResults,
      },
      200
    );
  } catch (error) {
    console.error("grantAccessByRole error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const revokeAccessByRole = async (c: Context) => {
  try {
    const { fileId, role } = await c.req.json();

    if (!fileId || !role) {
      return c.json({ error: "Missing fileId or role" }, 400);
    }

    const users = await db
      .select({ email: User.email })
      .from(User)
      .where(eq(User.role, role));

    if (!users || users.length === 0) {
      return c.json({ error: `No users found with role: ${role}` }, 404);
    }

    const permissionsRes = await drive.permissions.list({
      fileId,
      supportsAllDrives: true,
      fields: "permissions(id,emailAddress)",
    });

    const permissions = permissionsRes.data.permissions ?? [];
    const revokeResults = [];

    for (const user of users) {
      const permission = permissions.find((p) => p.emailAddress === user.email);

      if (permission) {
        try {
          await drive.permissions.delete({
            fileId,
            permissionId: permission.id!,
            supportsAllDrives: true,
          });
          revokeResults.push({ email: user.email, success: true });
        } catch (err) {
          console.error(`Failed to revoke access for ${user.email}`, err);
          revokeResults.push({
            email: user.email,
            success: false,
            error: String(err),
          });
        }
      } else {
        revokeResults.push({
          email: user.email,
          success: false,
          error: "Permission not found",
        });
      }
    }

    return c.json(
      {
        message: `Access revoked for users with role '${role}'`,
        results: revokeResults,
      },
      200
    );
  } catch (error) {
    console.error("revokeAccessByRole error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * Make a file publicly accessible (anyone with the link can view)
 */
export const makeFilePublic = async (c: Context) => {
  try {
    const { fileId } = await c.req.json();

    if (!fileId) {
      return c.json({ error: "Missing fileId" }, 400);
    }

    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // Create public permission (anyone with the link can view)
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
      supportsAllDrives: true,
    });

    // Get the updated webViewLink
    const file = await drive.files.get({
      fileId,
      fields: "webViewLink",
      supportsAllDrives: true,
    });

    const userId = decoded.id as number;
    const userEmail = decoded.email as string;
    await logUserAction(
      userId,
      userEmail,
      `User ${userEmail} made file with ID ${fileId} publicly accessible`
    );

    return c.json(
      {
        success: true,
        message: "File is now publicly accessible with the link",
        webViewLink: file.data.webViewLink,
      },
      200
    );
  } catch (error) {
    console.error("makeFilePublic error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * Make a file private (only specific users can access)
 */
export const makeFilePrivate = async (c: Context) => {
  try {
    const { fileId } = await c.req.json();

    if (!fileId) {
      return c.json({ error: "Missing fileId" }, 400);
    }

    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // Find and remove the "anyone" permission
    const permissionsRes = await drive.permissions.list({
      fileId,
      supportsAllDrives: true,
      fields: "permissions(id,type)",
    });

    const permissions = permissionsRes.data.permissions ?? [];
    const anyonePermission = permissions.find((p) => p.type === "anyone");

    if (anyonePermission && anyonePermission.id) {
      await drive.permissions.delete({
        fileId,
        permissionId: anyonePermission.id,
        supportsAllDrives: true,
      });
    }

    const userId = decoded.id as number;
    const userEmail = decoded.email as string;
    await logUserAction(
      userId,
      userEmail,
      `User ${userEmail} made file with ID ${fileId} private (restricted access)`
    );

    return c.json(
      {
        success: true,
        message: "File access is now restricted to specific users only",
      },
      200
    );
  } catch (error) {
    console.error("makeFilePrivate error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const getFilePermissions = async (c: Context) => {
  try {
    const body = await c.req.json();
    const fileId = body.fileId;

    if (!fileId) {
      return c.json({ error: "File ID is required in the request body" }, 400);
    }

    // Authenticate user
    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // Get file metadata including permissions
    const fileRes = await drive.files.get({
      fileId,
      fields: "name,mimeType,size,modifiedTime,capabilities",
      supportsAllDrives: true,
    });

    // Get detailed permissions
    const permissionsRes = await drive.permissions.list({
      fileId,
      fields: "permissions(id,type,role,emailAddress,displayName,domain)",
      supportsAllDrives: true,
    });

    const permissions = permissionsRes.data.permissions ?? [];

    // Determine if the file is public (has "anyone" permission)
    const isPublic = permissions.some((p) => p.type === "anyone");

    // Format the permissions for frontend display
    const formattedPermissions = permissions.map((p) => ({
      id: p.id,
      type: p.type,
      role: p.role,
      email: p.emailAddress || null,
      name: p.displayName || null,
      domain: p.domain || null,
    }));

    return c.json(
      {
        fileInfo: {
          id: fileId,
          name: fileRes.data.name,
          mimeType: fileRes.data.mimeType,
          size: fileRes.data.size,
          modifiedTime: fileRes.data.modifiedTime,
          capabilities: fileRes.data.capabilities,
        },
        permissions: formattedPermissions,
        accessLevel: {
          isPublic: isPublic,
          accessType: isPublic ? "Anyone with the link" : "Restricted",
        },
      },
      200
    );
  } catch (error: any) {
    console.error("getFilePermissions error:", {
      message: error.message,
      responseData: error.response?.data,
      stack: error.stack,
    });
    return c.json({ error: "Failed to retrieve file permissions" }, 500);
  }
};

export const giveEvidenceAccessByAuditorId = async (c: Context) => {
  try {
    // Get compliance ID and auditor ID from URL params
    const complianceId = parseInt(c.req.param("complianceId"));
    const auditorId = parseInt(c.req.param("auditorId"));

    if (!complianceId || !auditorId) {
      return c.json({ error: "Missing complianceId or auditorId" }, 400);
    }

    // Get auditor's email
    const auditor = await db.query.User.findFirst({
      where: eq(User.id, auditorId),
    });

    if (!auditor) {
      return c.json({ error: "Auditor not found" }, 404);
    }

    // Get all criteria for the compliance
    const criteria = await db.query.Criteria.findMany({
      where: eq(Criteria.compliance_id, complianceId),
    });

    if (!criteria.length) {
      return c.json({ error: "No criteria found for this compliance" }, 404);
    }

    // Get all evidence IDs connected to these criteria
    const criteriaIds = criteria.map((crit) => crit.id);
    const evidenceCriteria = await db
      .select()
      .from(EvidenceCriteria)
      .where(inArray(EvidenceCriteria.criteria_id, criteriaIds));

    if (!evidenceCriteria.length) {
      return c.json({ error: "No evidence found for these criteria" }, 404);
    }

    // Get all unique evidence records
    const evidenceIds = [
      ...new Set(evidenceCriteria.map((ec) => ec.evidence_id)),
    ];
    const evidences = await db
      .select()
      .from(Evidences)
      .where(inArray(Evidences.id, evidenceIds));

    // Grant access to each file
    const grantResults = [];
    for (const evidence of evidences) {
      try {
        await drive.permissions.create({
          fileId: evidence.drive_file_id,
          requestBody: {
            type: "user",
            role: "reader",
            emailAddress: auditor.email,
          },
          sendNotificationEmail: false,
          supportsAllDrives: true,
        });

        grantResults.push({
          fileId: evidence.drive_file_id,
          fileName: evidence.file_name,
          success: true,
        });
      } catch (err) {
        console.error(`Failed to grant access to ${evidence.file_name}`, err);
        grantResults.push({
          fileId: evidence.drive_file_id,
          fileName: evidence.file_name,
          success: false,
          error: String(err),
        });
      }
    }

    // Get the user who performed this action from the token
    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // Log the action
    await logUserAction(
      decoded.id,
      decoded.email,
      `User ${decoded.email} granted evidence access to auditor ${auditor.email} for compliance ID ${complianceId}`
    );

    return c.json(
      {
        message: `Access granted to ${auditor.email} for ${grantResults.length} files`,
        results: grantResults,
      },
      200
    );
  } catch (error) {
    console.error("giveEvidenceAccessByAuditorId error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const revokeEvidenceAccessByAuditorId = async (c: Context) => {
  try {
    const complianceId = parseInt(c.req.param("complianceId"));
    const auditorId = parseInt(c.req.param("auditorId"));

    if (!complianceId || !auditorId) {
      return c.json({ error: "Missing complianceId or auditorId" }, 400);
    }

    // Get auditor's email
    const auditor = await db.query.User.findFirst({
      where: eq(User.id, auditorId),
    });

    if (!auditor) {
      return c.json({ error: "Auditor not found" }, 404);
    }

    // Get all criteria for the compliance
    const criteria = await db.query.Criteria.findMany({
      where: eq(Criteria.compliance_id, complianceId),
    });

    if (!criteria.length) {
      return c.json({ error: "No criteria found for this compliance" }, 404);
    }

    // Get all evidence IDs connected to these criteria
    const criteriaIds = criteria.map((crit) => crit.id);
    const evidenceCriteria = await db
      .select()
      .from(EvidenceCriteria)
      .where(inArray(EvidenceCriteria.criteria_id, criteriaIds));

    if (!evidenceCriteria.length) {
      return c.json({ error: "No evidence found for these criteria" }, 404);
    }

    // Get all unique evidence records
    const evidenceIds = [
      ...new Set(evidenceCriteria.map((ec) => ec.evidence_id)),
    ];
    const evidences = await db
      .select()
      .from(Evidences)
      .where(inArray(Evidences.id, evidenceIds));

    // For each evidence file, get its permissions and revoke the auditor's access
    const revokeResults = [];
    for (const evidence of evidences) {
      try {
        // Get file permissions
        const permissionsRes = await drive.permissions.list({
          fileId: evidence.drive_file_id,
          fields: "permissions(id,emailAddress)",
          supportsAllDrives: true,
        });

        const permissions = permissionsRes.data.permissions ?? [];
        const auditorPermission = permissions.find(
          (p) => p.emailAddress === auditor.email
        );

        if (auditorPermission?.id) {
          // Revoke access by deleting the permission
          await drive.permissions.delete({
            fileId: evidence.drive_file_id,
            permissionId: auditorPermission.id,
            supportsAllDrives: true,
          });

          revokeResults.push({
            fileId: evidence.drive_file_id,
            fileName: evidence.file_name,
            success: true,
          });
        }
      } catch (err) {
        console.error(`Failed to revoke access to ${evidence.file_name}`, err);
        revokeResults.push({
          fileId: evidence.drive_file_id,
          fileName: evidence.file_name,
          success: false,
          error: String(err),
        });
      }
    }

    // Get the user who performed this action from the token
    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);
    if (!token) return c.json({ error: "Token missing" }, 401);

    const decoded = verifyJwtToken(token);
    if (!decoded?.email || !decoded?.id)
      return c.json({ error: "Invalid token" }, 401);

    // Log the action
    await logUserAction(
      decoded.id,
      decoded.email,
      `User ${decoded.email} revoked evidence access from auditor ${auditor.email} for compliance ID ${complianceId}`
    );

    return c.json(
      {
        message: `Access revoked from ${auditor.email} for ${revokeResults.length} files`,
        results: revokeResults,
      },
      200
    );
  } catch (error) {
    console.error("revokeEvidenceAccessByAuditorId error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
