import {
  createComment,
  getCommentsByCriteriaId,
  getCommentById,
  updateComment,
  deleteComment,
} from "@/controllers/comment-controller.ts";
import {
  authMiddleware,
  roleMiddleware,
} from "@/middleware/auth-middleware.ts";
import { Hono } from "hono";

export const commentRoute = new Hono();

commentRoute.use(
  "*",
  authMiddleware,
  roleMiddleware(["Administrator", "Auditor"])
);
commentRoute.post("/:criteriaId", createComment);
commentRoute.get("/criteria/:criteriaId", getCommentsByCriteriaId);
commentRoute.get("/:commentId", getCommentById);
commentRoute.put("/:commentId", updateComment);
commentRoute.delete("/:commentId", deleteComment);
