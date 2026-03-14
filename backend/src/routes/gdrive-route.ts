import { Hono } from "hono";
import { handleFileUpload, handleFileList,handleFileDelete,grantAccessByRole,revokeAccessByRole,makeFilePrivate,makeFilePublic,getFilePermissions, getFilesFromDrive, giveEvidenceAccessByAuditorId, revokeEvidenceAccessByAuditorId } from "../controllers/gdrive-controller.ts";
import { authMiddleware,roleMiddleware } from "@/middleware/auth-middleware.ts";


const gdriveRoutes = new Hono();
gdriveRoutes.use("*", authMiddleware);
gdriveRoutes.post("/upload", handleFileUpload);
gdriveRoutes.get("/view", handleFileList);
gdriveRoutes.get("/view-fast", async (c) => {
  try {
    const query = c.req.query("query") || "";
    const startDate = c.req.query("startDate") || undefined;
    const endDate = c.req.query("endDate") || undefined;
    const extension = c.req.query("extension") || undefined;
    const pageSize = parseInt(c.req.query("pageSize") || "5", 10);
    const pageToken = c.req.query("pageToken") || undefined;
    
    // Always skip permissions for the fast route
    const skipPermissions = true;

    const result = await getFilesFromDrive(
      process.env.GDRIVE_FOLDER!, 
      query, 
      startDate, 
      endDate, 
      extension,
      pageSize,
      pageToken,
      skipPermissions,
    );
    
    return c.json(result, 200);
  } catch (error) {
    console.error("Error fetching files:", error);
    return c.json({ error: "Failed to fetch files" }, 500);
  }
});
gdriveRoutes.delete("/delete", handleFileDelete); 
gdriveRoutes.post("/grant-access-role",roleMiddleware(["Administrator"]),grantAccessByRole );
gdriveRoutes.post("/make-private",roleMiddleware(["Administrator"]),makeFilePrivate );
gdriveRoutes.post("/make-public",roleMiddleware(["Administrator"]),makeFilePublic );
gdriveRoutes.post("/revoke-access-role",roleMiddleware(["Administrator"]),revokeAccessByRole );

gdriveRoutes.post("/compliance/:complianceId/auditor/:auditorId", roleMiddleware(["Administrator"]), giveEvidenceAccessByAuditorId);
gdriveRoutes.delete("/compliance/:complianceId/auditor/:auditorId", roleMiddleware(["Administrator"]), revokeEvidenceAccessByAuditorId);

export default gdriveRoutes;
