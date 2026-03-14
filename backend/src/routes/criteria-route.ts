import { Hono } from "hono";
import {createCriteria,updateCriteria,deleteCriteria, getCriteriaByComplianceId} from "@/controllers/criteria-controller.ts"
import { authMiddleware,roleMiddleware } from "@/middleware/auth-middleware.ts";

const criteriaRoute = new Hono();

criteriaRoute.use("*", authMiddleware);

criteriaRoute.post("/create",roleMiddleware(["Administrator"]), createCriteria);
criteriaRoute.put("/:id/edit",roleMiddleware(["Administrator"]), updateCriteria);
criteriaRoute.delete("/:id/delete", roleMiddleware(["Administrator"]),deleteCriteria);
criteriaRoute.get("/compliance/:complianceId", getCriteriaByComplianceId);


export default criteriaRoute;