import { Hono } from "hono";
import { 
  getAllEvidences, 
  getEvidenceById,
  getEvidencesByCriteriaId,
  getCriteriaByEvidenceId,
  getAllEvidenceCriteria,
  createEvidenceCriteria,
  deleteEvidenceCriteria,
  createEvidenceCriteriaFromTag,
  updateEvidenceExpiry,
  resetNotificationStatus
} from "@/controllers/evidence-controller.ts";
import { authMiddleware } from "@/middleware/auth-middleware.ts";

const evidenceRoute = new Hono();

// Apply auth middleware to all routes
evidenceRoute.use("*", authMiddleware);

// Base evidence routes
evidenceRoute.get("/", getAllEvidences);
evidenceRoute.get("/:id", getEvidenceById);

// Evidence-Criteria relationship routes
evidenceRoute.get("/e-criteria/all", getAllEvidenceCriteria);
evidenceRoute.post("/e-criteria/create", createEvidenceCriteria);
evidenceRoute.delete("/e-criteria/:id/delete", deleteEvidenceCriteria);

// Additional query routes
evidenceRoute.get("/by-criteria/:criteriaId", getEvidencesByCriteriaId);
evidenceRoute.get("/criteria-by-evidence/:evidenceId", getCriteriaByEvidenceId);

// NEW: Route for creating EvidenceCriteria based on Tag
evidenceRoute.post("/e-criteria/from-tag", createEvidenceCriteriaFromTag);

// NEW: Routes for managing evidence expiry and notification status
evidenceRoute.put("/:id/update-expiry", updateEvidenceExpiry);
evidenceRoute.put("/:id/reset-notification", resetNotificationStatus);

export default evidenceRoute;
