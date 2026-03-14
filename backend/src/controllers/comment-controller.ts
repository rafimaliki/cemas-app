import type { Context } from "hono";
import { db } from "@/db/index.ts";
import { Criteria, CriteriaComment } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";
import { CommentSchema } from "@/schema/comment-schema.ts";

// POST - /comment/:criteriaId
export async function createComment(c: Context) {
  try {
    const criteriaId = c.req.param("criteriaId");
    const body = await c.req.json();

    // console.log("Creating comment with body:", body);

    if (!criteriaId || Number.isNaN(Number(criteriaId))) {
      return c.json({ error: "Invalid criteria ID" }, 400);
    }

    const parse = CommentSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { comment } = parse.data;

    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized. User information missing" }, 401);
    }

    const criteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, Number(criteriaId)),
    });

    if (!criteria) {
      return c.json({ error: "Criteria not found" }, 404);
    }

    const childCriteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.parent_id, Number(criteriaId)),
    })

    if (childCriteria){
      return c.json({
        error: "Comment can only be added to last criteria"
      },403);
    }

    const [newComment] = await db
      .insert(CriteriaComment)
      .values({
        criteria_id: Number(criteriaId),
        user_id: user.id,
        comment,
        created_at: new Date(),
      })
      .returning();

    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} added comment to criteria ${criteria.name}`,
      "COMMENT_ADD",
      criteria.compliance_id
    );

    return c.json(
      {
        message: "Comment added successfully",
        data: newComment,
      },
      201
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ error: "Failed to add comment" }, 500);
  }
}

// GET - /comment/:criteriaId
export async function getCommentsByCriteriaId(c: Context) {
  try {
    const criteriaId = c.req.param("criteriaId");

    if (!criteriaId || Number.isNaN(Number(criteriaId))) {
      return c.json({ error: "Invalid criteria ID" }, 400);
    }

    const criteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, Number(criteriaId)),
    });

    if (!criteria) {
      return c.json({ error: "Criteria not found" }, 404);
    }

    const comments = await db.query.CriteriaComment.findMany({
      where: eq(CriteriaComment.criteria_id, Number(criteriaId)),
      with: {
        user: true,
      },
      orderBy: (criteriaComment) => [criteriaComment.created_at],
    });

    return c.json({
      message: "Comments retrieved successfully",
      data: comments,
    });
  } catch (error) {
    console.error("Error retrieving comments:", error);
    return c.json({ error: "Failed to retrieve comments" }, 500);
  }
}

// GET - /comments/:commentId
export async function getCommentById(c: Context) {
  try {
    const commentId = c.req.param("commentId");

    if (!commentId || Number.isNaN(Number(commentId))) {
      return c.json({ error: "Invalid comment ID" }, 400);
    }

    const comment = await db.query.CriteriaComment.findFirst({
      where: eq(CriteriaComment.id, Number(commentId)),
      with: {
        user: true,
        criteria: true,
      },
    });

    if (!comment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    return c.json({
      message: "Comment retrieved successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error retrieving comment:", error);
    return c.json({ error: "Failed to retrieve comment" }, 500);
  }
}

// PUT - /comments/:commentId
export async function updateComment(c: Context) {
  try {
    const commentId = c.req.param("commentId");
    const body = await c.req.json();

    if (!commentId || Number.isNaN(Number(commentId))) {
      return c.json({ error: "Invalid comment ID" }, 400);
    }

    const parse = CommentSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { comment } = parse.data;
    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized. User information missing" }, 401);
    }

    const existingComment = await db.query.CriteriaComment.findFirst({
      where: eq(CriteriaComment.id, Number(commentId)),
      with: {
        criteria: true,
      },
    });

    if (!existingComment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    if (existingComment.user_id !== user.id) {
      return c.json({ error: "You can only edit your own comments" }, 403);
    }

    const [updatedComment] = await db
      .update(CriteriaComment)
      .set({ comment })
      .where(eq(CriteriaComment.id, Number(commentId)))
      .returning();

    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} updated comment on criteria`
    );

    return c.json({
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return c.json({ error: "Failed to update comment" }, 500);
  }
}

// DELETE - /comments/:commentId
export async function deleteComment(c: Context) {
  try {
    const commentId = c.req.param("commentId");

    if (!commentId || Number.isNaN(Number(commentId))) {
      return c.json({ error: "Invalid comment ID" }, 400);
    }

    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized. User information missing" }, 401);
    }

    // Check if comment exists
    const existingComment = await db.query.CriteriaComment.findFirst({
      where: eq(CriteriaComment.id, Number(commentId)),
      with: {
        criteria: true,
      },
    });

    if (!existingComment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    if (existingComment.user_id !== user.id && user.role !== "Administrator") {
      return c.json(
        {
          error:
            "You can only delete your own comments unless you're an administrator",
        },
        403
      );
    }

    const [deletedComment] = await db
      .delete(CriteriaComment)
      .where(eq(CriteriaComment.id, Number(commentId)))
      .returning();

    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} deleted comment from criteria}`
    );

    return c.json({
      message: "Comment deleted successfully",
      data: deletedComment,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return c.json({ error: "Failed to delete comment" }, 500);
  }
}
