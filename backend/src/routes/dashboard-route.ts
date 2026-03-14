import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth-middleware.ts";
import { getDashboardInfo } from "@/controllers/dashboard-controller.ts";

const dashboardRoute = new Hono();

dashboardRoute.use("*", authMiddleware);
dashboardRoute.get("/", getDashboardInfo);

export default dashboardRoute;
