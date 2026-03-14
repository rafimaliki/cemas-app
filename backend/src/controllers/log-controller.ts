import { db } from "@/db/index.ts";
import type { Context } from "hono";
import { desc, eq } from "drizzle-orm";
import { Logs } from "@/db/schema.ts";

function constructLogResponse(log: any) {
  return {
    id: log.id?.toString() || "",
    userId: log.user_id?.toString() || "",
    userName: log.user?.name || "Unknown User",
    action: "Unknown Action",
    category: log.category || "GENERAL",
    complianceId: log.compliance_id?.toString() || null,
    complianceName: log.compliance?.name || null,
    criteriaId: log.criteria_id ?? undefined,
    criteriaPrefix: log.criteria_prefix ?? undefined,
    details: log.description ?? undefined,
    timestamp: log.created_at?.toISOString?.() || new Date().toISOString(),
  };
}

export const getLogs = async (c: Context) => {
  try {
    const logs = await db.query.Logs.findMany({
      orderBy: [desc(Logs.created_at)],
      with: {
        user: true,
        compliance: true,
      },
    });

    const formattedLogs = logs.map(constructLogResponse);

    return c.json({
      success: true,
      message: "Logs fetched successfully",
      data: formattedLogs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "An error occurred while fetching logs",
      },
      500
    );
  }
};

export const getLogsByComplianceId = async (c: Context) => {
  const complianceId = c.req.param("complianceId");

  // console.log("fetching logs for complianceId:", complianceId);

  if (!complianceId) {
    return c.json(
      {
        success: false,
        message: "Compliance ID is required",
      },
      400
    );
  }

  try {
    const logs = await db.query.Logs.findMany({
      where: eq(Logs.compliance_id, Number(complianceId)),
      orderBy: [desc(Logs.created_at)],
      with: {
        user: true,
        compliance: true,
      },
    });

    // console.log("logs fetched:", logs);

    const formattedLogs = logs.map(constructLogResponse);

    return c.json({
      success: true,
      message: "Logs fetched successfully",
      data: formattedLogs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "An error occurred while fetching logs",
      },
      500
    );
  }
};
