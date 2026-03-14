import { db } from "@/db/index.ts";
import type { Context } from "hono";
import { desc, eq } from "drizzle-orm";
import { Compliance, ComplianceAccess, Criteria } from "@/db/schema.ts";

function roundToOneDecimal(num: number) {
  return Math.round(num * 10) / 10;
}

interface ComplianceCriterion {
  evidences: { evidence: any }[];
}

interface ComplianceInfo {
  // Info untuk compliance
  id: number | null;
  name: string | null;
  description: string | null;
  created_at: string | null;
  // Info untuk general info dan compliance
  count_compliant: number; // berapa banyak compliance yang compliant untuk general info atau 0/1 jika spesifik
  total_compliance: number; // berapa banyak compliance untuk general info atau 1 jika spesifik
  percentage_compliance: number; // compliant criteria / total criteria
  status_distribution: {
    compliant: number;
    non_compliant: number;
    in_progress: number;
  };
  count_evidences: number;
  total_evidences: number; // jumlah criteria tanpa children
  percentage_evidences: number; // count evidences / total evidences
}

function getSummaryInfo(compliances: ComplianceInfo[]) {
  const summaryInfo: ComplianceInfo = {
    id: null,
    name: "All",
    description: "Compliances",
    created_at: null,
    count_compliant: 0,
    total_compliance: 0,
    percentage_compliance: 0,
    status_distribution: {
      compliant: 0,
      non_compliant: 0,
      in_progress: 0,
    },
    count_evidences: 0,
    total_evidences: 0,
    percentage_evidences: 0,
  };

  summaryInfo.status_distribution = {
    compliant: 0,
    non_compliant: 0,
    in_progress: 0,
  };

  for (const compliance of compliances) {
    summaryInfo.count_compliant += compliance.count_compliant;
    summaryInfo.total_compliance += compliance.total_compliance;
    summaryInfo.count_evidences += compliance.count_evidences;
    summaryInfo.total_evidences += compliance.total_evidences;

    summaryInfo.status_distribution.compliant +=
      compliance.status_distribution.compliant;
    summaryInfo.status_distribution.non_compliant +=
      compliance.status_distribution.non_compliant;
    summaryInfo.status_distribution.in_progress +=
      compliance.status_distribution.in_progress;
  }

  const total_criteria =
    summaryInfo.status_distribution.compliant +
    summaryInfo.status_distribution.non_compliant +
    summaryInfo.status_distribution.in_progress;

  summaryInfo.percentage_compliance =
    (summaryInfo.status_distribution.compliant / total_criteria) * 100;
  summaryInfo.percentage_compliance = roundToOneDecimal(
    summaryInfo.percentage_compliance
  );
  summaryInfo.percentage_evidences =
    (summaryInfo.count_evidences / summaryInfo.total_evidences) * 100;
  summaryInfo.percentage_evidences = roundToOneDecimal(
    summaryInfo.percentage_evidences
  );

  return summaryInfo as ComplianceInfo;
}

function constructComplianceInfo(compliance: any) {
  // console.log("compliance info constructing", compliance);

  const complianceInfo: ComplianceInfo = {
    id: null,
    name: null,
    description: null,
    created_at: null,
    count_compliant: 0,
    total_compliance: 0,
    percentage_compliance: 0,
    status_distribution: {
      compliant: 0,
      non_compliant: 0,
      in_progress: 0,
    },
    count_evidences: 0,
    total_evidences: 0,
    percentage_evidences: 0,
  };

  complianceInfo.id = compliance.id;
  complianceInfo.name = compliance.name;
  complianceInfo.description = compliance.description;
  complianceInfo.created_at = compliance.created_at;

  const criterias = compliance.criteria as any[];

  complianceInfo.status_distribution = {
    compliant: criterias.filter((c) => c.status === "compliant").length,
    non_compliant: criterias.filter((c) => c.status === "non-compliant").length,
    in_progress: criterias.filter((c) => c.status === "in-progress").length,
  };

  const totalCriteria = criterias.length;

  complianceInfo.count_compliant =
    complianceInfo.status_distribution.compliant === totalCriteria ? 1 : 0;
  complianceInfo.total_compliance = 1;
  complianceInfo.percentage_compliance =
    (complianceInfo.status_distribution.compliant / totalCriteria) * 100;
  complianceInfo.percentage_compliance = roundToOneDecimal(
    complianceInfo.percentage_compliance
  );

  const countCriteriaWithoutChildren = criterias.filter(
    (c) => !c.children || c.children.length === 0
  ).length;
  const countEvidences = criterias.reduce((acc, criterion) => {
    return acc + criterion.evidences.length;
  }, 0);

  complianceInfo.count_evidences = countEvidences;
  complianceInfo.total_evidences = countCriteriaWithoutChildren;
  complianceInfo.percentage_evidences =
    (countEvidences / countCriteriaWithoutChildren) * 100;
  complianceInfo.percentage_evidences = roundToOneDecimal(
    complianceInfo.percentage_evidences
  );

  return complianceInfo as ComplianceInfo;
}

function constructResponse(compliances: any[]): {
  summary: ComplianceInfo;
  compliances: ComplianceInfo[];
} {
  const compliancesInfo = compliances.map((compliance) => {
    return constructComplianceInfo(compliance);
  });

  const summaryInfo = getSummaryInfo(compliancesInfo);
  const response = {
    summary: summaryInfo,
    compliances: compliancesInfo,
  };

  return response;
}

export async function getDashboardInfo(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    // console.log("user", user);

    let compliances;

    if (user.role === "Auditor") {
      compliances = await db.query.ComplianceAccess.findMany({
        where: eq(ComplianceAccess.auditor_id, user.id),
        with: {
          compliance: {
            with: {
              criteria: {
                with: {
                  evidences: { with: { evidence: true } },
                  children: true,
                },
              },
            },
          },
        },
      });
      compliances = compliances.map((access) => access.compliance);
    } else {
      compliances = await db.query.Compliance.findMany({
        orderBy: [desc(Compliance.created_at)],
        with: {
          criteria: {
            with: {
              evidences: { with: { evidence: true } },
              children: true,
            },
          },
        },
      });
    }

    const data = constructResponse(compliances);

    return c.json({ message: "Dashboard Info", data: data }, 200);
  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    return c.json({ error: "Failed to fetch dashboard info" }, 500);
  }
}
