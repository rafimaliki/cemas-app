import type { Context } from "hono";
import { db } from "@/db/index.ts";
import { Tags ,Criteria,CriteriaTags, Compliance} from "@/db/schema.ts";
import { logUserAction } from "@/utils/logger-util.ts";
import { eq ,and} from "drizzle-orm"

export const addCriteriaToTag = async (c: Context) => {
  try {
    // Get the data from the request
    const { tag_id, criteria_id } = await c.req.json();

    // Validate input
    if (!tag_id || !criteria_id) {
      return c.json({
        success: false,
        message: "Tag ID and Criteria ID are required"
      }, 400);
    }

    // Check if the tag exists
    const tagExists = await db.query.Tags.findFirst({
      where: eq(Tags.id, tag_id)
    });

    if (!tagExists) {
      return c.json({
        success: false,
        message: "Tag not found"
      }, 404);
    }

    // Check if the criteria exists
    const criteriaExists = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, criteria_id)
    });

    if (!criteriaExists) {
      return c.json({
        success: false,
        message: "Criteria not found"
      }, 404);
    }

   const childCriteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.parent_id, criteria_id)
    });

    if (childCriteria) {
      return c.json({
        success: false,
        message: "Tags can only be added to last criteria"
      }, 403);
    }

    // Check if the relationship already exists
    const relationExists = await db.query.CriteriaTags.findFirst({
      where: and(
        eq(CriteriaTags.tag_id, tag_id),
        eq(CriteriaTags.criteria_id, criteria_id)
      )
    });

    if (relationExists) {
      return c.json({
        success: false,
        message: "This tag is already associated with this criteria"
      }, 409);
    }

    // Create the criteria-tag relationship
    const [criteriaTag] = await db.insert(CriteriaTags).values({
      tag_id,
      criteria_id
    }).returning();

    // Log user action
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} associated criteria ID ${criteria_id} with tag ID ${tag_id}`
    );

    return c.json({
      success: true,
      message: "Criteria successfully associated with tag",
      criteriaTag
    }, 201);
  } catch (error) {
    console.error("Error associating criteria with tag:", error);
    return c.json({
      success: false,
      message: "Failed to associate criteria with tag"
    }, 500);
  }
};
export const removeCriteriaFromTag = async (c: Context) => {
  try {
    // Get the data from the request body instead of URL parameters
    const { tag_id, criteria_id } = await c.req.json();
    
    // Validate input
    if (!tag_id || !criteria_id) {
      return c.json({
        success: false,
        message: "Tag ID and Criteria ID are required"
      }, 400);
    }
    
    // Check if the relationship exists
    const relationExists = await db.query.CriteriaTags.findFirst({
      where: and(
        eq(CriteriaTags.tag_id, tag_id),
        eq(CriteriaTags.criteria_id, criteria_id)
      )
    });
    
    if (!relationExists) {
      return c.json({
        success: false,
        message: "This tag is not associated with this criteria"
      }, 404);
    }
    
    // Remove the relationship
    await db.delete(CriteriaTags)
      .where(and(
        eq(CriteriaTags.tag_id, tag_id),
        eq(CriteriaTags.criteria_id, criteria_id)
      ));
      
    // Log user action
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} removed association between criteria ID ${criteria_id} and tag ID ${tag_id}`,
      "TAG_REMOVE"
    );
    
    return c.json({
      success: true,
      message: "Criteria successfully disassociated from tag"
    });
  } catch (error) {
    console.error("Error removing criteria from tag:", error);
    return c.json({
      success: false,
      message: "Failed to remove criteria from tag"
    }, 500);
  }
};
export const createTag = async (c: Context) => {
  try {
    const { name, description } = await c.req.json();

    // Validate input
    if (!name || !description) {
      return c.json({
        success: false,
        message: "Name and description are required"
      }, 400);
    }

    // Create the tag
    const [tag] = await db.insert(Tags).values({
      name,
      description,
      created_at: new Date()
    }).returning();

    // Log user action
    const user = c.get("user");
    await logUserAction(
      user.id, 
      user.email, 
      `User ${user.email} created tag ${tag.name}`,
      "TAG_CREATE"
    );

    return c.json({
      success: true,
      message: "Tag created successfully",
      tag
    }, 201);
  } catch (error) {
    console.error("Error creating tag:", error);
    return c.json({
      success: false,
      message: "Failed to create tag"
    }, 500);
  }
};

export const getTags = async (c: Context) => {
  try {
    const tags = await db.query.Tags.findMany();

    return c.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return c.json({
      success: false,
      message: "Failed to fetch tags"
    }, 500);
  }
};

export const getTagById = async (c: Context) => {
  try {
    const tagId = c.req.param("id");

    const tag = await db.query.Tags.findFirst({
      where: eq(Tags.id, Number.parseInt(tagId))
    });

    if (!tag) {
      return c.json({
        success: false,
        message: "Tag not found"
      }, 404);
    }

    return c.json({
      success: true,
      tag
    });
  } catch (error) {
    console.error("Error fetching tag by ID:", error);
    return c.json({
      success: false,
      message: "Failed to fetch tag"
    }, 500);
  }
};

export const deleteTag = async (c: Context) => {
  try {
    const tagId = c.req.param("id");

    const result = await db.delete(Tags)
      .where(eq(Tags.id, Number.parseInt(tagId)))
      .returning();

    if (result.length === 0) {
      return c.json({
        success: false,
        message: "Tag not found"
      }, 404);
    }

    // Log user action
    const user = c.get("user");
    await logUserAction(
      user.id, 
      user.email, 
      `User ${user.email} deleted tag ${result[0].name}`,
      "TAG_DELETE"
    );

    return c.json({
      success: true,
      message: "Tag deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return c.json({
      success: false,
      message: "Failed to delete tag"
    }, 500);
  }
};

export const getTagsWithCriteria = async (c: Context) => {
  try {
    // Ambil semua tag
    const tags = await db.query.Tags.findMany();

    // Untuk setiap tag, ambil daftar kriteria yang terhubung beserta compliance name
    const tagsWithCriteria = await Promise.all(
      tags.map(async (tag) => {
        const criteria = await db
          .select({
            id: Criteria.id,
            name: Criteria.name,
            description: Criteria.description,
            level: Criteria.level,
            status: Criteria.status,
            created_at: Criteria.created_at,
            compliance_id: Criteria.compliance_id,
            compliance_name: Compliance.name,
            prefix: Criteria.prefix
          })
          .from(Criteria)
          .innerJoin(CriteriaTags, eq(Criteria.id, CriteriaTags.criteria_id))
          .innerJoin(Compliance, eq(Criteria.compliance_id, Compliance.id))
          .where(eq(CriteriaTags.tag_id, tag.id));

        return {
          ...tag,
          criteria
        };
      })
    );

    return c.json({
      success: true,
      tags: tagsWithCriteria
    });
  } catch (error) {
    console.error("Error fetching tags with criteria:", error);
    return c.json({
      success: false,
      message: "Failed to fetch tags with criteria"
    }, 500);
  }
};

export const updateTag = async (c: Context) => {
  try {
    const tagId = c.req.param("id");
    const { name, description } = await c.req.json();

    // Validate input
    if (!name && !description) {
      return c.json({
        success: false,
        message: "At least one field (name or description) is required to update"
      }, 400);
    }

    // Check if the tag exists
    const tagExists = await db.query.Tags.findFirst({
      where: eq(Tags.id, Number.parseInt(tagId))
    });

    if (!tagExists) {
      return c.json({
        success: false,
        message: "Tag not found"
      }, 404);
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string;
      updated_at: Date;
    } = {
      updated_at: new Date()
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Update the tag
    const [updatedTag] = await db
      .update(Tags)
      .set(updateData)
      .where(eq(Tags.id, Number.parseInt(tagId)))
      .returning();

    // Log user action
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} updated tag ${updatedTag.name}`,
      "TAG_UPDATE"
    );

    return c.json({
      success: true,
      message: "Tag updated successfully",
      tag: updatedTag
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    return c.json({
      success: false,
      message: "Failed to update tag"
    }, 500);
  }
}