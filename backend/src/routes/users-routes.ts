import { Hono } from "hono";
import {
  getAllUsers,
  getUserById,
  whitelistUser,
  updateUserRole,
  deleteUser,
  updateUserStatus,
} from "@/controllers/users-controller.ts";
import {
  authMiddleware,
  roleMiddleware,
} from "@/middleware/auth-middleware.ts";

const usersRoute = new Hono();

// Apply auth middleware to all user routes
usersRoute.use("*", authMiddleware);

// User routes
usersRoute.get(
  "/",
  roleMiddleware(["Administrator", "Contributor"]),
  getAllUsers
);
usersRoute.get("/:id", getUserById);
usersRoute.post("/whitelist", roleMiddleware(["Administrator"]), whitelistUser);
usersRoute.put("/:id/role", roleMiddleware(["Administrator"]), updateUserRole);
usersRoute.put(
  "/:id/status",
  roleMiddleware(["Administrator"]),
  updateUserStatus
);
usersRoute.delete("/:id", roleMiddleware(["Administrator"]), deleteUser);

export default usersRoute;
