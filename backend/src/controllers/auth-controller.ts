import type { Context } from "hono";
import {
  fetchGoogleToken,
  fetchGoogleUserInfo,
  generateJwtToken,
} from "@/services/auth-service.ts";
import { extractJwtFromCookies } from "@/utils/cookie-util.ts";
import jwt from "jsonwebtoken";
import { db } from "@/db/index.ts";
import { User } from "@/db/schema.ts";
import { ConsoleLogWriter, eq } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";

const { FRONTEND_URL } = process.env;
const { BACKEND_URL } = process.env;
const { JWT_EXPIRY } = process.env;

export async function googleAuth(c: Context) {
  const authParams = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${BACKEND_URL}/api/auth/callback/google`,
    response_type: "code",
    scope: "openid email profile",
  });

  return c.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`
  );
}

export async function googleCallback(c: Context) {
  const code = c.req.query("code");

  if (!code) return c.redirect(`${FRONTEND_URL}/auth-response/error`);
  try {
    const tokenData = await fetchGoogleToken(code);
    if (!tokenData?.access_token) {
      return c.redirect(`${FRONTEND_URL}/auth-response/error`);
    }

    const userInfo = await fetchGoogleUserInfo(tokenData.access_token);
    if (!userInfo?.email) {
      return c.redirect(`${FRONTEND_URL}/auth-response/error`);
    }

    let user = await db
      .select()
      .from(User)
      .where(eq(User.email, userInfo.email))
      .limit(1)
      .then((rows) => rows[0]);
    if (!user) {
      return c.redirect(`${FRONTEND_URL}/auth-response/no-access`);
    }

    const result = await db
      .update(User)
      .set({
        name: userInfo.name,
        avatar: userInfo.picture || "",
        lastLogin: new Date(),
      })
      .where(eq(User.id, user.id))
      .returning();

    user = result[0];

    if (user.status !== "Active") {
      return c.redirect(`${FRONTEND_URL}/auth-response/no-access`);
    }

    const jwtToken = generateJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: userInfo.picture || "",
      role: user.role,
    });

    c.header(
      "Set-Cookie",
      `authToken=${jwtToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${JWT_EXPIRY}`
    );
    // log
    if (user.role !== "Administrator") {
      await logUserAction(
        user.id,
        user.email,
        `User ${user.email} has Logged in'`,
        "AUTH_LOGIN"
      );
    }

    return c.redirect(`${FRONTEND_URL}/auth-response/success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return c.redirect(`${FRONTEND_URL}/auth-response/error`);
  }
}

export async function getUser(c: Context) {
  const token = extractJwtFromCookies(c.req.header("Cookie"));
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return c.json(decoded);
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function logoutUser(c: Context) {
  // log
  const user = c.get("user");
  if (user.role !== "Administrator") {
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} has Logged out'`,
      "AUTH_LOGOUT"
    );
  }

  c.header(
    "Set-Cookie",
    "authToken=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0"
  );
  return c.json({ message: "Logged out successfully" });
}
