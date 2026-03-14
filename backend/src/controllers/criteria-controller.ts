import type { Context } from "hono";
import { db } from "@/db/index.ts";
import { Criteria } from "@/db/schema.ts";
import { CriteriaSchema } from "@/schema/criteria-schema.ts";
import { eq, inArray } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";

//POST /criteria/create
export async function createCriteria(c: Context) {
  try {
    const body = await c.req.json();
    // console.log("Creating criteria with body:", body);

    const parse = CriteriaSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    // console.log("Parsed criteria data:", parse.data);

    const {
      compliance_id,
      parent_id,
      prefix,
      name,
      description,
      level,
      pic_id,
      status,
    } = parse.data;
    const created_at = new Date();

    // console.log("data", {
    //   compliance_id,
    //   parent_id,
    //   prefix,
    //   name,
    //   description,
    //   level,
    //   pic_id,
    //   status,
    //   created_at,
    // });

    if (parent_id) {
      const parentCriteria = await db.query.Criteria.findFirst({
        where: eq(Criteria.id, parent_id),
        with: {
          evidences: true
        }
      });

      if (!parentCriteria) {
        return c.json({ error: "Parent criteria not found" }, 404);
      }

      if (parentCriteria.pic_id) {
        return c.json({ 
          error: "Cannot add child criteria to a parent that has a PIC assigned" 
        }, 403);
      }

      if (parentCriteria.evidences && parentCriteria.evidences.length > 0) {
        return c.json({ 
          error: "Cannot add child criteria to a parent that has evidences attached" 
        }, 403);
      }
    } 

    const [newCriteria] = await db
      .insert(Criteria)
      .values({
        compliance_id,
        parent_id,
        prefix,
        name,
        description,
        level,
        pic_id,
        status,
        created_at,
      })
      .returning();

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} has Created Criteria ${name}`,
      "CRITERIA_CREATE",
      compliance_id ?? undefined
    );

    return c.json({ message: "Criteria created", data: newCriteria }, 201);
  } catch (err) {
    console.error("Error creating criteria:", err);
    return c.json(
      { error: "Something went wrong while creating the criteria." },
      500
    );
  }
}

//PUT /criteria/:id/edit
export async function updateCriteria(c: Context) {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid criteria ID" }, 400);
    }
    // console.log("body", body);
    const parse = CriteriaSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { name, description, pic_id, status, prefix } = parse.data;

    const existingCriteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, Number(id)),
    });

    if (!existingCriteria) {
      return c.json({ error: "Criteria not found" }, 404);
    }

    const [updatedCriteria] = await db
      .update(Criteria)
      .set({
        name,
        description,
        pic_id,
        status,
        prefix,
      })
      .where(eq(Criteria.id, Number(id)))
      .returning();

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} Updated Criteria ${name}`,
      "CRITERIA_UPDATE",
      existingCriteria.compliance_id
    );

    return c.json(
      {
        message: "Criteria updated successfully",
        data: updatedCriteria,
      },
      200
    );
  } catch (error) {
    console.error("Error updating criteria:", error);
    return c.json({ error: "Failed to update criteria" }, 500);
  }
}

//DELETE /criteria/:id/delete
export async function deleteCriteria(c: Context) {
  try {
    const id = c.req.param("id");

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid criteria ID" }, 400);
    }

    const existingCriteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, Number(id)),
    });

    if (!existingCriteria) {
      return c.json({ error: "Criteria not found" }, 404);
    }

    const result = await db.transaction(async (tx) => {
      const idNum = Number(id);

      const level2Ids = await tx
        .select({ id: Criteria.id })
        .from(Criteria)
        .where(eq(Criteria.parent_id, idNum));

      const level3Ids = await tx
        .select({ id: Criteria.id })
        .from(Criteria)
        .where(
          inArray(
            Criteria.parent_id,
            level2Ids.map((c) => c.id)
          )
        );

      const level4Ids = await tx
        .select({ id: Criteria.id })
        .from(Criteria)
        .where(
          inArray(
            Criteria.parent_id,
            level3Ids.map((c) => c.id)
          )
        );

      const level4 = await tx
        .delete(Criteria)
        .where(
          inArray(
            Criteria.id,
            level4Ids.map((c) => c.id)
          )
        )
        .returning();

      const level3 = await tx
        .delete(Criteria)
        .where(
          inArray(
            Criteria.id,
            level3Ids.map((c) => c.id)
          )
        )
        .returning();

      const level2 = await tx
        .delete(Criteria)
        .where(
          inArray(
            Criteria.id,
            level2Ids.map((c) => c.id)
          )
        )
        .returning();

      // parent
      const [deletedCriteria] = await tx
        .delete(Criteria)
        .where(eq(Criteria.id, idNum))
        .returning();

      return {
        criteria: deletedCriteria,
        childrenCount: level2.length + level3.length + level4.length,
      };
    });

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} Deleted Criteria ${result.criteria.name} and ${result.childrenCount} child criteria `,
      "CRITERIA_DELETE",
      result.criteria.compliance_id
    );

    return c.json(
      {
        message: "Criteria and all child criteria deleted successfully",
        data: {
          deletedCriteria: result.criteria,
          deletedChildrenCount: result.childrenCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error deleting criteria:", error);
    return c.json({ error: "Failed to delete criteria" }, 500);
  }
}

// GET /criteria/compliance/:complianceId
export async function getCriteriaByComplianceId(c: Context) {
  try {
    const complianceId = c.req.param("complianceId");

    if (!complianceId || Number.isNaN(Number(complianceId))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }

    const criteria = await db.query.Criteria.findMany({
      where: eq(Criteria.compliance_id, Number(complianceId)),
      orderBy: (criteria, { asc }) => [asc(criteria.level), asc(criteria.id)],
    });

    if (!criteria || criteria.length === 0) {
      return c.json(
        { message: "No criteria found for this compliance", data: [] },
        200
      );
    }

    return c.json(
      {
        message: "Criteria retrieved successfully",
        data: criteria,
      },
      200
    );
  } catch (error) {
    console.error("Error retrieving criteria:", error);
    return c.json({ error: "Failed to retrieve criteria" }, 500);
  }
}
