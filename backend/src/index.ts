import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import usersRoute from "./routes/users-routes.js";
import gdriveRoutes from "./routes/gdrive-route.js";
import authRoute from "./routes/auth-route.js";
import complianceRoute from "./routes/compliance-route.js";
import criteriaRoute from "./routes/criteria-route.js";
import { commentRoute } from "./routes/comment-route.ts";
import tagRouter from "./routes/tag-route.ts";
import complianceAccessRouter from "./routes/compliance-access-route.ts";
import { logger } from "hono/logger";
import evidenceRoute from "./routes/evidence-route.ts";
import { seedUsers, seedCompliance } from "./scripts/seed.ts";
import { swaggerConfig } from "./utils/swagger-config.ts";
import dashboardRoute from "./routes/dashboard-route.ts";
import logRoute from "./routes/log-route.ts";
import { emailRoute } from "./routes/notif-route.ts";
import { initializeScheduledTasks } from "./utils/scheduler-util.ts";

import dotenv from "dotenv";
dotenv.config();

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(logger());

app.get("/swagger.json", (c) => {
  return c.json(swaggerConfig);
});

app.get(
  "/swagger-ui",
  swaggerUI({
    url: "/swagger.json",
  })
);

app.get("/test", (c) => {
  return c.text("Hello Hono!!!");
});

app.route("/api/users", usersRoute);
app.route("/api/drive", gdriveRoutes);
app.route("/api/auth", authRoute);
app.route("/api/compliance", complianceRoute);
app.route("/api/criteria", criteriaRoute);
app.route("/api/evidence", evidenceRoute);
app.route("/api/comment", commentRoute);
app.route("/api/tag", tagRouter);
app.route("/api/compliance-access", complianceAccessRouter);
app.route("/api/dashboard", dashboardRoute);
app.route("/api/logs", logRoute);
app.route("/api/email", emailRoute);

// Add a redirect from root to Swagger UI for convenience
app.get("/api-docs", (c) => c.redirect("/swagger-ui"));

await seedUsers();

// await seedCompliance();

// Initialize scheduled tasks
initializeScheduledTasks();

serve(
  {
    fetch: app.fetch,
    port: 5000,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Server is running on :${info.port}`);
    console.log(
      `API documentation available at http://localhost:${info.port}/swagger-ui`
    );
    console.log("Scheduled tasks initialized");
    console.log("Maximum file upload size: 100MB"); // Note: This is now handled in the parseBody middleware
  }
);
