import { Hono } from "hono";
import { 
  createComplianceAccess,
  updateComplianceAccess,
  deleteComplianceAccess,
  deleteComplianceAccessByComplianceAndAuditor,
  getComplianceAccessByComplianceId,
  getComplianceAccessByAuditorId,
} from "@/controllers/compliance-access-controller.ts";
import { authMiddleware, roleMiddleware } from "@/middleware/auth-middleware.ts";

const complianceAccessRouter = new Hono();

// Apply auth middleware to all routes
complianceAccessRouter.use("*", authMiddleware);

// Admin-only routes
complianceAccessRouter.post("/create", roleMiddleware(["Administrator"]), createComplianceAccess);
complianceAccessRouter.put("/:id", roleMiddleware(["Administrator"]), updateComplianceAccess);
complianceAccessRouter.delete("/:id", roleMiddleware(["Administrator"]), deleteComplianceAccess);
complianceAccessRouter.delete("/compliance/:complianceId/auditor/:auditorId", roleMiddleware(["Administrator"]), deleteComplianceAccessByComplianceAndAuditor);


// Routes accessible to all authenticated users
complianceAccessRouter.get("/compliance/:complianceId", getComplianceAccessByComplianceId);
complianceAccessRouter.get("/auditor/:auditorId", getComplianceAccessByAuditorId);

export default complianceAccessRouter;