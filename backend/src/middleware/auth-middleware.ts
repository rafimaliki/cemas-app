import { extractJwtFromCookies, verifyJwtToken } from "@/utils/cookie-util.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";
import { User } from "@/db/schema.js";
import type { Context, Next } from "hono";

/**
 * Authentication middleware that verifies JWT token and adds user to the context
 *
 * @param c - Hono context
 * @param next - Next function to continue the request pipeline
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const cookieHeader = c.req.header("Cookie");
    const token = extractJwtFromCookies(cookieHeader);

    if (!token) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const decoded = verifyJwtToken(token);
    if (!decoded?.email) {
      return c.json({ error: "Invalid authentication token" }, 401);
    }

    // Verify user exists in database
    const user = await db.query.User.findFirst({
      where: eq(User.email, decoded.email),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Add user to the context variables for use in route handlers
    c.set("user", user);
    c.set("decodedToken", decoded);

    return await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
}

/**
 * Role-based authorization middleware
 *
 * @param roles - Array of roles allowed to access the resource
 */
export function roleMiddleware(roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    // console.log("User in role middleware:", user);
    if (!user) {
      console.error("User not found in role middleware");
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!roles.includes(user.role)) {
      console.error("User does not have the required role:", roles);
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    return await next();
  };
}
