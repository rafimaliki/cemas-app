import { Hono } from "hono";
import { sendEmail, checkExpiringEvidence } from "../controllers/notif-controller.ts";
import { authMiddleware, roleMiddleware } from "@/middleware/auth-middleware.ts";

export const emailRoute = new Hono();

// Apply auth middleware to all routes
emailRoute.use("*", authMiddleware);

emailRoute.post("/send", async (c) => {
  const { to, subject, message } = await c.req.json();

  try {
    await sendEmail({
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    return c.json({ success: true, message: "Email sent!" });
  } catch (err) {
    console.error("Email error:", err);
    return c.json({ success: false, message: "Failed to send email." }, 500);
  }
});

// Endpoint to manually check for expiring evidence and send notifications
// Only administrators can manually trigger this check
emailRoute.post("/check-expiring-evidence", roleMiddleware(["Administrator"]), async (c) => {
  try {
    const result = await checkExpiringEvidence();
    return c.json(result);
  } catch (err) {
    console.error("Error checking expiring evidence:", err);
    return c.json({ 
      success: false, 
      message: "Failed to check for expiring evidence." 
    }, 500);
  }
});
