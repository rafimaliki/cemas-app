import type { Context } from "hono";
import { db } from "@/db/index.ts";
import { Compliance, Criteria, ComplianceAccess } from "@/db/schema.ts";
import { ComplianceSchema } from "@/schema/compliance-schema.ts";
import { desc, eq, and } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";
import { parseExcelForCompliance } from "@/scripts/excel-parser.ts";
import { readFile, writeFile, unlink } from "node:fs/promises";

//POST /compliance/create
export async function createCompliance(c: Context) {
  const body = await c.req.json();

  // console.log("Creating compliance with body:", body);

  const parse = ComplianceSchema.safeParse(body);
  if (!parse.success) {
    return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
  }

  const { name, description, expiry_date } = parse.data;

  const now = new Date();

  const [newCompliance] = await db
    .insert(Compliance)
    .values({
      name,
      description,
      created_at: now,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
    })
    .returning();
  // log
  const user = c.get("user");
  await logUserAction(
    user.id,
    user.email,
    `User ${user.email} has Created Compliance ${name}`,
    "COMPLIANCE_CREATE",
    newCompliance.id
  );

  return c.json({ message: "Compliance created", data: newCompliance }, 201);
}

//PUT /compliance/:id/edit
export async function updateCompliance(c: Context) {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }
    const parse = ComplianceSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { name, description, expiry_date } = parse.data;

    const existingCompliance = await db.query.Compliance.findFirst({
      where: eq(Compliance.id, Number(id)),
    });

    if (!existingCompliance) {
      return c.json({ error: "Compliance not found" }, 404);
    }

    const [updatedCompliance] = await db
      .update(Compliance)
      .set({
        name,
        description,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
      })
      .where(eq(Compliance.id, Number(id)))
      .returning();

    //log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} Updated Compliance ${name}`,
      "COMPLIANCE_UPDATE",
      Number(id)
    );

    return c.json(
      {
        message: "Compliance updated successfully",
        data: updatedCompliance,
      },
      200
    );
  } catch (error) {
    console.error("Error updating compliance:", error);
    return c.json({ error: "Failed to update compliance" }, 500);
  }
}

//DELETE /compliance/:id/delete
export async function deleteCompliance(c: Context) {
  try {
    const id = c.req.param("id");

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }

    const existingCompliance = await db.query.Compliance.findFirst({
      where: eq(Compliance.id, Number(id)),
    });

    if (!existingCompliance) {
      return c.json({ error: "Compliance not found" }, 404);
    }

    const result = await db.transaction(async (tx) => {
      const deletedCriteria = await tx
        .delete(Criteria)
        .where(eq(Criteria.compliance_id, Number(id)))
        .returning();

      const [deletedCompliance] = await tx
        .delete(Compliance)
        .where(eq(Compliance.id, Number(id)))
        .returning();

      return {
        compliance: deletedCompliance,
        criteriaCount: deletedCriteria.length,
      };
    });

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} Deleted Compliance ${result.compliance.name}`,
      "COMPLIANCE_DELETE",
      result.compliance.id
    );

    return c.json(
      {
        message: "Compliance and associated criteria deleted successfully",
        data: {
          deletedCompliance: result.compliance,
          deletedCriteriaCount: result.criteriaCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error deleting compliance:", error);
    return c.json({ error: "Failed to delete compliance" }, 500);
  }
}

//GET /compliance
export async function getAllCompliances(c: Context) {
  try {
    const user = c.get("user");
    let compliances;

    // If user is an auditor
    if (user.role === "Auditor") {
      compliances = await db.query.ComplianceAccess.findMany({
        where: eq(ComplianceAccess.auditor_id, user.id),
        with: {
          compliance: {
            with: {
              criteria: {
                with: {
                  comments: { with: { user: true } },
                  evidences: { with: { evidence: true } },
                  pic: true,
                  tags: { with: { tag: true } },
                  children: true,
                },
              },
            },
          },
        },
      });

      compliances = compliances.map((access) => access.compliance);
    } else {
      // For administrators and contributors
      compliances = await db.query.Compliance.findMany({
        orderBy: [desc(Compliance.created_at)],
        with: {
          criteria: {
            with: {
              comments: { with: { user: true } },
              evidences: { with: { evidence: true } },
              pic: true,
              tags: { with: { tag: true } },
              children: true,
            },
          },
          accesses: {
            with: {
              auditor: true,
            },
          },
        },
      });
    }

    return c.json(
      {
        message: "Compliances retrieved successfully",
        data: compliances,
      },
      200
    );
  } catch (error) {
    console.error("Error retrieving compliances:", error);
    return c.json({ error: "Failed to retrieve compliances" }, 500);
  }
}

//GET /compliance/:id
export async function getComplianceById(c: Context) {
  // console.log("Getting compliance by ID");
  try {
    const id = c.req.param("id");
    const user = c.get("user");

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }

    // For auditors, check if they have access to this compliance
    if (user.role === "Auditor") {
      const access = await db.query.ComplianceAccess.findFirst({
        where: (complianceAccess) => {
          return and(
            eq(complianceAccess.compliance_id, Number(id)),
            eq(complianceAccess.auditor_id, user.id)
          );
        },
      });

      if (!access) {
        return c.json(
          { error: "You don't have access to this compliance" },
          403
        );
      }
    }

    const compliance = await db.query.Compliance.findFirst({
      where: eq(Compliance.id, Number(id)),
      with: {
        criteria: {
          with: {
            comments: {
              with: {
                user: true,
              },
            },
            evidences: {
              with: {
                evidence: true,
              },
            },
            pic: true,
            tags: {
              with: {
                tag: true,
              },
            },
            children: true,
          },
        },
        accesses: {
          with: {
            auditor: true,
          },
        },
      },
    });

    if (!compliance) {
      console.error("Compliance not found:", id);
      return c.json({ error: "Compliance not found" }, 404);
    }

    const criteriaMap = new Map<number, any>();
    const rootCriterias: any[] = [];

    // console.log(JSON.stringify(compliance.criteria, null, 2));

    for (const crit of compliance.criteria) {
      const transformed = {
        id: crit.id,
        prefix: crit.prefix,
        compliance_id: crit.compliance_id,
        parent_id: crit.parent_id,
        name: crit.name,
        description: crit.description,
        level: crit.level,
        created_at: crit.created_at,
        pic_id: crit.pic_id,
        status: crit.status.toLowerCase(),
        evidence: crit.evidences.map((e: any) => ({
          id: e.id,
          name: e.evidence.file_name,
          url: e.evidence.file_path,
          uploadedBy: e.evidence.uploaded_by,
          uploadedAt: e.evidence.uploaded_at.toISOString(),
          expiryDate: e.evidence.expired_by,
        })),
        comments: crit.comments.map((cmt: any) => ({
          id: cmt.id,
          userId: cmt.user_id,
          userName: cmt.user?.name ?? "Unknown User",
          text: cmt.comment,
          timestamp: cmt.created_at
            ? cmt.created_at.toISOString()
            : new Date().toISOString(),
        })),
        children: [],
      };

      criteriaMap.set(crit.id, transformed);
    }

    for (const crit of compliance.criteria) {
      const node = criteriaMap.get(crit.id);
      if (crit.parent_id) {
        const parent = criteriaMap.get(crit.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCriterias.push(node);
      }
    }

    const sortByPrefix = (a: any, b: any) => {
      const aParts = a.prefix.split(".").map(Number);
      const bParts = b.prefix.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;

        if (aVal !== bVal) {
          return aVal - bVal;
        }
      }

      return 0;
    };

    rootCriterias.sort(sortByPrefix);

    const sortChildrenRecursively = (criteria: any[]) => {
      if (!criteria || criteria.length === 0) return;

      criteria.sort(sortByPrefix);

      for (const criterion of criteria) {
        if (criterion.children && criterion.children.length > 0) {
          sortChildrenRecursively(criterion.children);
        }
      }
    };

    for (const rootCriteria of rootCriterias) {
      if (rootCriteria.children.length > 0) {
        sortChildrenRecursively(rootCriteria.children);
      }
    }

    const transformedCompliance = {
      id: compliance.id,
      title: compliance.name,
      standard: compliance.name,
      version: new Date(compliance.created_at).getFullYear().toString(),
      criterias: rootCriterias,
    };

    return c.json(
      {
        message: "Compliance retrieved successfully",
        data: transformedCompliance,
      },
      200
    );
  } catch (error) {
    console.error("Error retrieving compliance:", error);
    return c.json({ error: "Failed to retrieve compliance" }, 500);
  }
}

// POST /compliance/import-excel
export async function importComplianceFromExcel(c: Context) {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided or invalid file" }, 400);
    }

    // Check file extension
    const fileName = file.name;
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return c.json(
        { error: "File must be an Excel file (.xlsx or .xls)" },
        400
      );
    }

    // Get form data
    const complianceName = body.name as string;
    const complianceDescription = body.description as string;
    const expiryDate = body.expiryDate
      ? new Date(body.expiryDate as string)
      : undefined;

    if (!complianceName || !complianceDescription) {
      return c.json(
        { error: "Compliance name and description are required" },
        400
      );
    }

    // Save file temporarily
    const buffer = await file.arrayBuffer();
    const tempFilePath = `/tmp/${fileName}`;
    await writeFile(tempFilePath, Buffer.from(buffer));

    // Get user info from context
    const user = c.get("user");

    // Parse and process Excel
    const result = await parseExcelForCompliance(
      tempFilePath,
      complianceName,
      complianceDescription,
      expiryDate,
      user.id,
      user.email
    );

    // Clean up temp file
    try {
      await unlink(tempFilePath);
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }

    return c.json(
      {
        message: "Compliance import successful",
        data: result,
      },
      201
    );
  } catch (error) {
    console.error("Error importing compliance from Excel:", error);
    return c.json({ error: "Failed to import compliance from Excel" }, 500);
  }
}
