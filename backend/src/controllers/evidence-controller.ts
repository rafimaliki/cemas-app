import type { Context } from "hono";
import { db } from "@/db/index.ts";
import {
  EvidenceCriteria,
  Evidences,
  Criteria,
  CriteriaTags,
  Tags,
} from "@/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";

// Original evidence functions
export const getAllEvidences = async (c: Context) => {
  try {
    const evidences = await db.query.Evidences.findMany({
      with: {
        criteria: {
          with: {
            criteria: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      data: evidences,
    });
  } catch (error) {
    console.error("Error fetching evidences:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch evidences",
      },
      500
    );
  }
};

export const getEvidenceById = async (c: Context) => {
  try {
    const evidenceId = c.req.param("id");

    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.id, Number.parseInt(evidenceId)),
      with: {
        criteria: {
          with: {
            criteria: true,
          },
        },
      },
    });

    if (!evidence) {
      return c.json(
        {
          success: false,
          message: "Evidence not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch evidence",
      },
      500
    );
  }
};

/**
 * Update an evidence's expiry date and reset notification status
 */
export const updateEvidenceExpiry = async (c: Context) => {
  try {
    const evidenceId = c.req.param("id");
    const { expiry_date } = await c.req.json();

    if (!expiry_date) {
      return c.json(
        {
          success: false,
          message: "Expiry date is required",
        },
        400
      );
    }

    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.id, Number.parseInt(evidenceId)),
    });

    if (!evidence) {
      return c.json(
        {
          success: false,
          message: "Evidence not found",
        },
        404
      );
    }

    const newExpiryDate = new Date(expiry_date);

    // Update the evidence with new expiry date and reset notification status
    await db
      .update(Evidences)
      .set({
        expired_by: newExpiryDate,
        notified: false, // Reset notification status when expiry date changes
      })
      .where(eq(Evidences.id, Number.parseInt(evidenceId)));

    // Log the update
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} updated expiry date for evidence "${
        evidence.file_name
      }" to ${newExpiryDate.toISOString().split("T")[0]}`
    );

    return c.json({
      success: true,
      message: "Evidence expiry date updated successfully",
    });
  } catch (error) {
    console.error("Error updating evidence expiry:", error);
    return c.json(
      {
        success: false,
        message: "Failed to update evidence expiry date",
      },
      500
    );
  }
};

/**
 * Reset notification status for an evidence
 */
export const resetNotificationStatus = async (c: Context) => {
  try {
    const evidenceId = c.req.param("id");

    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.id, Number.parseInt(evidenceId)),
    });

    if (!evidence) {
      return c.json(
        {
          success: false,
          message: "Evidence not found",
        },
        404
      );
    }

    // Reset notification status
    await db
      .update(Evidences)
      .set({ notified: false })
      .where(eq(Evidences.id, Number.parseInt(evidenceId)));

    // Log the action
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} reset notification status for evidence "${evidence.file_name}"`
    );

    return c.json({
      success: true,
      message: "Evidence notification status reset successfully",
    });
  } catch (error) {
    console.error("Error resetting notification status:", error);
    return c.json(
      {
        success: false,
        message: "Failed to reset notification status",
      },
      500
    );
  }
};

// NEW: EvidenceCriteria specific controllers
export const getAllEvidenceCriteria = async (c: Context) => {
  try {
    const evidenceCriteria = await db.query.EvidenceCriteria.findMany({
      with: {
        criteria: true,
        evidence: true,
      },
    });

    return c.json({
      success: true,
      data: evidenceCriteria,
    });
  } catch (error) {
    console.error("Error fetching evidence criteria:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch evidence criteria",
      },
      500
    );
  }
};

export const deleteEvidenceCriteria = async (c: Context) => {
  try {
    const relationshipId = c.req.param("id");

    // Check if relationship exists
    const relation = await db.query.EvidenceCriteria.findFirst({
      where: eq(EvidenceCriteria.id, Number.parseInt(relationshipId)),
    });

    if (!relation) {
      return c.json(
        {
          success: false,
          message: "Evidence-Criteria relationship not found",
        },
        404
      );
    }

    const [evidence, criteria] = await Promise.all([
      db.query.Evidences.findFirst({
        where: eq(Evidences.id, relation.evidence_id),
        columns: {
          file_name: true,
        },
      }),
      db.query.Criteria.findFirst({
        where: eq(Criteria.id, relation.criteria_id),
        columns: {
          name: true,
        },
      }),
    ]);

    // Delete the relationship
    await db
      .delete(EvidenceCriteria)
      .where(eq(EvidenceCriteria.id, Number.parseInt(relationshipId)));

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} removed Evidence "${
        evidence?.file_name ?? "Unknown"
      }" from Criteria "${criteria?.name ?? "Unknown"}"`
    );

    return c.json({
      success: true,
      message: "Evidence-Criteria relationship deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting evidence-criteria relationship:", error);
    return c.json(
      {
        success: false,
        message: "Failed to delete evidence-criteria relationship",
      },
      500
    );
  }
};

export const getEvidencesByCriteriaId = async (c: Context) => {
  try {
    const criteriaId = c.req.param("criteriaId");

    const evidenceCriteria = await db.query.EvidenceCriteria.findMany({
      where: eq(EvidenceCriteria.criteria_id, Number.parseInt(criteriaId)),
      with: {
        evidence: true,
      },
    });

    const evidences = evidenceCriteria.map((ec) => ec.evidence);

    return c.json({
      success: true,
      data: evidences,
    });
  } catch (error) {
    console.error("Error fetching evidences by criteria:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch evidences",
      },
      500
    );
  }
};

export const getCriteriaByEvidenceId = async (c: Context) => {
  try {
    const evidenceDriveId = c.req.param("evidenceId");
    // console.log("EvidenceID: ", evidenceDriveId);

    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.drive_file_id, evidenceDriveId),
    });

    if (!evidence) {
      return c.json({ success: false, message: "Evidence not found" }, 404);
    }

    interface CriteriaWithId {
      id: number;
      prefix: string;
      level: number;
      name: string;
      description: string | null;
      status: string;
      created_at: Date;
      compliance_id: number;
      parent_id: number | null;
      pic_id: number | null;
      compliance: {
        id: number;
        name: string;
        description: string | null;
        created_at: Date;
        expiry_date: Date | null;
      };
    }

    const evidenceCriteria = await db.query.EvidenceCriteria.findMany({
      where: eq(EvidenceCriteria.evidence_id, evidence.id),
      with: {
        criteria: {
          with: {
            compliance: true,
          },
        },
      },
    });

    const result = evidenceCriteria
      .map((ec) => {
        const criteria = ec.criteria as CriteriaWithId;
        return {
          e_criteria_id: ec.id,
          id: criteria.id,
          prefix: criteria.prefix,
          level: criteria.level,
          name: criteria.name,
          description: criteria.description,
          status: criteria.status,
          created_at: criteria.created_at,
          compliance_id: criteria.compliance_id,
          parent_id: criteria.parent_id,
          pic_id: criteria.pic_id,
          compliance_name: criteria.compliance.name,
        };
      })
      .sort((a, b) => {
        const aParts = a.prefix.split(".").map(Number);
        const bParts = b.prefix.split(".").map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] || 0;
          const bVal = bParts[i] || 0;

          if (aVal !== bVal) {
            return aVal - bVal;
          }
        }

        if (a.level !== b.level) return a.level - b.level;
        return a.id - b.id;
      });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching criteria by evidence:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch criteria",
      },
      500
    );
  }
};

export const createEvidenceCriteriaFromTag = async (c: Context) => {
  try {
    const { drive_file_id, tag_id } = await c.req.json(); // Use drive_file_id instead of evidence_id

    // Validate input
    if (!drive_file_id || !tag_id) {
      return c.json(
        {
          success: false,
          message: "Drive File ID and Tag ID are required",
        },
        400
      );
    }

    // Check if the evidence exists based on drive_file_id
    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.drive_file_id, drive_file_id), // Check against drive_file_id
    });

    if (!evidence) {
      return c.json(
        {
          success: false,
          message: "Evidence not found",
        },
        404
      );
    }

    // Check if the tag exists
    const tag = await db.query.Tags.findFirst({
      where: eq(Tags.id, tag_id),
    });

    if (!tag) {
      return c.json(
        {
          success: false,
          message: "Tag not found",
        },
        404
      );
    }

    // Find all criteria associated with the tag
    const criteriaTags = await db.query.CriteriaTags.findMany({
      where: eq(CriteriaTags.tag_id, tag_id),
      with: {
        criteria: true,
      },
    });

    if (criteriaTags.length === 0) {
      return c.json(
        {
          success: false,
          message: "No criteria found for this tag",
        },
        404
      );
    }

    // Create EvidenceCriteria for each matching criteria
    const evidenceCriteriaPromises = criteriaTags.map(async (criteriaTag) => {
      const criteria = Array.isArray(criteriaTag.criteria)
        ? criteriaTag.criteria[0]
        : criteriaTag.criteria; // Ensure it's an object

      if (!criteria) {
        return; // Skip if there's no valid criteria object
      }

      const criteria_id = criteria.id;

      // Check if the relationship already exists
      const existingRelation = await db.query.EvidenceCriteria.findFirst({
        where: and(
          eq(EvidenceCriteria.criteria_id, criteria_id),
          eq(EvidenceCriteria.evidence_id, evidence.id) // Use the actual evidence ID here
        ),
      });

      if (!existingRelation) {
        // Create the relationship
        await db.insert(EvidenceCriteria).values({
          criteria_id,
          evidence_id: evidence.id, // Use the evidence's ID from the database
          added_at: new Date(),
        });
      }
    });

    // Wait for all EvidenceCriteria relationships to be created
    await Promise.all(evidenceCriteriaPromises);

    // log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} added Evidence "${evidence.file_name}" to criteria associated with tag "${tag.name}"`
    );

    return c.json(
      {
        success: true,
        message:
          "Evidence-Criteria relationships created successfully based on tag",
      },
      201
    );
  } catch (error) {
    console.error(
      "Error creating evidence-criteria relationships from tag:",
      error
    );
    return c.json(
      {
        success: false,
        message: "Failed to create evidence-criteria relationships from tag",
      },
      500
    );
  }
};

export const createEvidenceCriteria = async (c: Context) => {
  try {
    const { criteria_id, drive_file_id } = await c.req.json();

    // Validate input
    if (!criteria_id || !drive_file_id) {
      return c.json(
        {
          success: false,
          message: "Criteria ID and Drive File ID are required",
        },
        400
      );
    }

    // Check if criteria exists
    const criteria = await db.query.Criteria.findFirst({
      where: eq(Criteria.id, criteria_id),
    });

    if (!criteria) {
      return c.json(
        {
          success: false,
          message: "Criteria not found",
        },
        404
      );
    }

    // Find evidence by drive_file_id
    const evidence = await db.query.Evidences.findFirst({
      where: eq(Evidences.drive_file_id, drive_file_id),
    });

    if (!evidence) {
      return c.json(
        {
          success: false,
          message: "Evidence not found",
        },
        404
      );
    }

    // Check if relationship already exists
    const existingRelation = await db.query.EvidenceCriteria.findFirst({
      where: and(
        eq(EvidenceCriteria.criteria_id, criteria_id),
        eq(EvidenceCriteria.evidence_id, evidence.id)
      ),
    });

    if (existingRelation) {
      return c.json(
        {
          success: false,
          message: "This evidence is already linked to this criteria",
        },
        400
      );
    }

    // Create the relationship
    const [evidenceCriteria] = await db
      .insert(EvidenceCriteria)
      .values({
        criteria_id,
        evidence_id: evidence.id,
        added_at: new Date(),
      })
      .returning();

    // Log
    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} added Evidence "${evidence.file_name}" to Criteria "${criteria.name}"`,
      "EVIDENCE_ADD",
      criteria.compliance_id
    );

    return c.json(
      {
        success: true,
        message: "Evidence-Criteria relationship created successfully",
        data: evidenceCriteria,
        evidence: {
          id: evidenceCriteria.id,
          file_name: evidence.file_name,
          uploaded_by: evidence.uploaded_by,
          uploaded_at: evidence.uploaded_at,
          url: evidence.file_path,
          expired_by: evidence.expired_by,
        },
      },
      201
    );
  } catch (error) {
    console.error("Error creating evidence-criteria relationship:", error);
    return c.json(
      {
        success: false,
        message: "Failed to create evidence-criteria relationship",
      },
      500
    );
  }
};
