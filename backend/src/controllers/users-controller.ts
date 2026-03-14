import { db } from "../db/index.js";
import { User } from "../db/schema.js";
import { getUserParamsSchema } from "../schema/users-schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "hono";
import { logUserAction } from "../utils/logger-util.js";

// Route to get all users
// GET /users
export const getAllUsers = async (c: Context) => {
  try {
    const allUsers = await db.query.User.findMany();
    return c.json({ success: true, data: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ success: false, error: 'Failed to fetch users' }, 500);
  }
};

// Route to get a user by ID
// GET /users/:id
export const getUserById = async (c: Context) => {
  const { id } = c.req.param();
  const result = getUserParamsSchema.safeParse({ id });
  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }

  const user = await db.query.User.findFirst({
    where: eq(User.id, Number(id)),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
};

// Route to whitelist a user
// POST /users/whitelist
export const whitelistUser = async (c: Context) => {
  const body = await c.req.json();
  const { email, role } = body;

  const result = z
    .object({
      email: z.string().email(),
      role: z.enum(["Administrator", "Contributor", "Auditor"]),
    })
    .safeParse({ email, role });

  if (!result.success) {
    return c.json({ error: result.error.format() }, 401);
  }

  const { email: userEmail, role: userRole } = result.data;

  const existingUser = await db.query.User.findFirst({
    where: eq(User.email, userEmail),
  });

  if (existingUser) {
    return c.json({ error: "User already exists" }, 400);
  }

  const name = userEmail.split("@")[0];

  const newUser = await db
    .insert(User)
    .values({
      name,
      email: userEmail,
      avatar: "",
      role: userRole,
      status: "Active",
      createdAt: new Date(),
    })
    .returning();

  // Log the user creation
  const adminUser = c.get("user");
  await logUserAction(
    adminUser.id,
    adminUser.email,
    `User ${adminUser.email} created a new user with email ${userEmail} and role ${userRole}`,
    "USER_CREATE"
  );

  return c.json({ success: true, message: "User created successfully" }, 201);
};

// Route to update a user's role
// POST /users/:id/role
export const updateUserRole = async (c: Context) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { role } = body;

  const result = z
    .object({
      role: z.enum(["Administrator", "Contributor", "Auditor"]),
    })
    .safeParse({ role });

  if (!result.success) {
    return c.json({ error: result.error.format() }, 401);
  }

  const user = await db.query.User.findFirst({
    where: eq(User.id, Number(id)),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db
    .update(User)
    .set({ role })
    .where(eq(User.id, Number(id)));

  // Log the role update
  const adminUser = c.get("user");
  await logUserAction(
    adminUser.id,
    adminUser.email,
    `User ${adminUser.email} updated the role of user ${user.email} to ${role}`,
    "USER_UPDATE"
  );

  return c.json({ success: true, message: "User updated successfully" }, 200);
};

// Route to delete a user
// DELETE /users/:id
export const deleteUser = async (c: Context) => {
  const { id } = c.req.param();
  const result = getUserParamsSchema.safeParse({ id });

  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }

  const user = await db.query.User.findFirst({
    where: eq(User.id, Number(id)),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db.delete(User).where(eq(User.id, Number(id)));

  // Log the user deletion
  const adminUser = c.get("user");
  await logUserAction(
    adminUser.id,
    adminUser.email,
    `User ${adminUser.email} deleted user ${user.email}`,
    "USER_DELETE"
  );

  return c.json({ success: true, message: "User deleted successfully" }, 200);
};

// Route to update a user's status
// POST /users/:id/status
export const updateUserStatus = async (c: Context) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { status } = body;

  const result = z
    .object({
      status: z.enum(["Active", "Suspended"]),
    })
    .safeParse({ status });

  if (!result.success) {
    return c.json({ error: result.error.format() }, 401);
  }

  const user = await db.query.User.findFirst({
    where: eq(User.id, Number(id)),
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db
    .update(User)
    .set({ status })
    .where(eq(User.id, Number(id)));

  // Log the status update
  const adminUser = c.get("user");
  await logUserAction(
    adminUser.id,
    adminUser.email,
    `User ${adminUser.email} updated the status of user ${user.email} to ${status}`,
    "USER_UPDATE"
  );

  return c.json({ success: true, message: "User updated successfully" }, 200);
};
