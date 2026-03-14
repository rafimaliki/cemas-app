import type { Context } from "hono";
import { db } from "@/db/index.ts";
import { ComplianceAccess, Compliance, User } from "@/db/schema.ts";
import { ComplianceAccessSchema } from "@/schema/compliance-access-schema.ts";
import { eq, and } from "drizzle-orm";
import { logUserAction } from "@/utils/logger-util.ts";

export async function createComplianceAccess(c: Context) {
  try {
    const body = await c.req.json();
    const parse = ComplianceAccessSchema.safeParse(body);
    
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { compliance_id, auditor_id, accessible } = parse.data;

    // Check if compliance exists
    const compliance = await db.query.Compliance.findFirst({
      where: eq(Compliance.id, compliance_id)
    });

    if (!compliance) {
      return c.json({ error: "Compliance not found" }, 404);
    }

    // Check if auditor exists
    const auditor = await db.query.User.findFirst({
      where: eq(User.id, auditor_id)
    });

    if (!auditor) {
      return c.json({ error: "Auditor not found" }, 404);
    }

    // Check if access already exists
    const existingAccess = await db.query.ComplianceAccess.findFirst({
      where: and(
        eq(ComplianceAccess.compliance_id, compliance_id),
        eq(ComplianceAccess.auditor_id, auditor_id)
      )
    });

    if (existingAccess) {
      return c.json({ error: "Access already exists for this auditor" }, 400);
    }

    const [newAccess] = await db.insert(ComplianceAccess)
      .values({
        compliance_id,
        auditor_id,
        accessible
      })
      .returning();

    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} granted access to compliance ${compliance.name} for auditor ${auditor.email}`,
      "ACCESS_GRANT",
      compliance_id
    );

    return c.json({
      message: "Compliance access created successfully",
      data: newAccess
    }, 201);
  } catch (error) {
    console.error("Error creating compliance access:", error);
    return c.json({ error: "Failed to create compliance access" }, 500);
  }
}

export async function updateComplianceAccess(c: Context) {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid access ID" }, 400);
    }

    const parse = ComplianceAccessSchema.safeParse(body);
    if (!parse.success) {
      return c.json({ errors: parse.error.flatten().fieldErrors }, 400);
    }

    const { compliance_id, auditor_id, accessible } = parse.data;

    const existingAccess = await db.query.ComplianceAccess.findFirst({
      where: eq(ComplianceAccess.id, Number(id)),
      with: {
        compliance: true,
        auditor: true
      }
    });

    if (!existingAccess) {
      return c.json({ error: "Access not found" }, 404);
    }

    const [updatedAccess] = await db.update(ComplianceAccess)
      .set({ accessible })
      .where(eq(ComplianceAccess.id, Number(id)))
      .returning();

    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} updated access for compliance ${existingAccess.compliance && 'name' in existingAccess.compliance ? existingAccess.compliance.name : 'unknown'} and auditor ${existingAccess.auditor && 'email' in existingAccess.auditor ? existingAccess.auditor.email : 'unknown'}`,
      "ACCESS_UPDATE",
      existingAccess.compliance_id
    );

    return c.json({
      message: "Compliance access updated successfully",
      data: updatedAccess
    });
  } catch (error) {
    console.error("Error updating compliance access:", error);
    return c.json({ error: "Failed to update compliance access" }, 500);
  }
}

export async function deleteComplianceAccess(c: Context) {
  try {
    const id = c.req.param("id");

    if (!id || Number.isNaN(Number(id))) {
      return c.json({ error: "Invalid access ID" }, 400);
    }

    const existingAccess = await db.query.ComplianceAccess.findFirst({
      where: eq(ComplianceAccess.id, Number(id)),
      with: {
        compliance: true,
        auditor: true
      }
    });

    if (!existingAccess) {
      return c.json({ error: "Access not found" }, 404);
    }

    const [deletedAccess] = await db.delete(ComplianceAccess)
      .where(eq(ComplianceAccess.id, Number(id)))
      .returning();

    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} removed access for compliance ${existingAccess.compliance && 'name' in existingAccess.compliance ? existingAccess.compliance.name : 'unknown'} and auditor ${existingAccess.auditor && 'email' in existingAccess.auditor ? existingAccess.auditor.email : 'unknown'}`,
      "ACCESS_REVOKE",
      existingAccess.compliance_id
    );

    return c.json({
      message: "Compliance access deleted successfully",
      data: deletedAccess
    });
  } catch (error) {
    console.error("Error deleting compliance access:", error);
    return c.json({ error: "Failed to delete compliance access" }, 500);
  }
}

export async function deleteComplianceAccessByComplianceAndAuditor(c: Context) {
  try {
    const complianceId = c.req.param("complianceId");
    const auditorId = c.req.param("auditorId");

    if (!complianceId || Number.isNaN(Number(complianceId))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }

    if (!auditorId || Number.isNaN(Number(auditorId))) {
      return c.json({ error: "Invalid auditor ID" }, 400);
    }

    const existingAccess = await db.query.ComplianceAccess.findFirst({
      where: and(
        eq(ComplianceAccess.compliance_id, Number(complianceId)),
        eq(ComplianceAccess.auditor_id, Number(auditorId))
      ),
      with: {
        compliance: true,
        auditor: true
      }
    });

    if (!existingAccess) {
      return c.json({ error: "Access not found" }, 404);
    }

    const [deletedAccess] = await db.delete(ComplianceAccess)
      .where(and(
        eq(ComplianceAccess.compliance_id, Number(complianceId)),
        eq(ComplianceAccess.auditor_id, Number(auditorId))
      ))
      .returning();

    const user = c.get("user");
    await logUserAction(
      user.id,
      user.email,
      `User ${user.email} removed access for compliance ${existingAccess.compliance && 'name' in existingAccess.compliance ? existingAccess.compliance.name : 'unknown'} and auditor ${existingAccess.auditor && 'email' in existingAccess.auditor ? existingAccess.auditor.email : 'unknown'}`,
      "ACCESS_REVOKE",
      Number(complianceId)
    );

    return c.json({
      message: "Compliance access deleted successfully",
      data: deletedAccess
    });
  } catch (error) {
    console.error("Error deleting compliance access:", error);
    return c.json({ error: "Failed to delete compliance access" }, 500);
  }
}

export async function getComplianceAccessByComplianceId(c: Context) {
  try {
    const complianceId = c.req.param("complianceId");

    if (!complianceId || Number.isNaN(Number(complianceId))) {
      return c.json({ error: "Invalid compliance ID" }, 400);
    }

    const accesses = await db.query.ComplianceAccess.findMany({
      where: eq(ComplianceAccess.compliance_id, Number(complianceId)),
      with: {
        auditor: true
      }
    });

    return c.json({
      message: "Compliance accesses retrieved successfully",
      data: accesses
    });
  } catch (error) {
    console.error("Error retrieving compliance accesses:", error);
    return c.json({ error: "Failed to retrieve compliance accesses" }, 500);
  }
}

export async function getComplianceAccessByAuditorId(c: Context) {
  try {
    const auditorId = c.req.param("auditorId");

    if (!auditorId || Number.isNaN(Number(auditorId))) {
      return c.json({ error: "Invalid auditor ID" }, 400);
    }

    const accesses = await db.query.ComplianceAccess.findMany({
      where: eq(ComplianceAccess.auditor_id, Number(auditorId)),
      with: {
        compliance: true
      }
    });

    return c.json({
      message: "Compliance accesses retrieved successfully",
      data: accesses
    });
  } catch (error) {
    console.error("Error retrieving compliance accesses:", error);
    return c.json({ error: "Failed to retrieve compliance accesses" }, 500);
  }
}


