import { Hono } from "hono";
import {
  createCompliance,
  updateCompliance,
  deleteCompliance,
  getAllCompliances,
  getComplianceById,
  importComplianceFromExcel,
} from "@/controllers/compliance-controller.ts";
import { authMiddleware,roleMiddleware } from "@/middleware/auth-middleware.ts";

const complianceRouter = new Hono();

complianceRouter.use("*", authMiddleware);

complianceRouter.post("/create",roleMiddleware(["Administrator"]), createCompliance);
complianceRouter.put("/:id/edit",roleMiddleware(["Administrator"]), updateCompliance);
complianceRouter.delete("/:id/delete", roleMiddleware(["Administrator"]),deleteCompliance);
complianceRouter.get("/", getAllCompliances);
complianceRouter.get("/:id", getComplianceById);
complianceRouter.post("/import-excel", roleMiddleware(["Administrator"]), importComplianceFromExcel);

// Protected routes that require specific roles
// complianceRouter.post("/create", roleMiddleware(["admin", "manager"]), createCompliance);

export default complianceRouter;
