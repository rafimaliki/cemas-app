import { Hono } from "hono";
import {
  authMiddleware,
  roleMiddleware,
} from "@/middleware/auth-middleware.ts";
import {
  getLogs,
  getLogsByComplianceId,
} from "@/controllers/log-controller.ts";

const logRoute = new Hono();

logRoute.use("*", authMiddleware, roleMiddleware(["Administrator"]));
logRoute.get("/", getLogs);
logRoute.get("/:complianceId", getLogsByComplianceId);

export default logRoute;
