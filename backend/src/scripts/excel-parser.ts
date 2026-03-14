import * as XLSX from "xlsx";

import { db } from "../db/index.ts";
import { Compliance, Criteria } from "../db/schema.ts";
import { logUserAction } from "../utils/logger-util.ts";

interface CriteriaRow {
  prefix: string;
  name: string;
}

function calculateLevelFromPrefix(prefix: string): number {
  // Count the number of segments in the prefix
  return prefix.split(".").length;
}

export async function parseExcelForCompliance(
  filePath: string,
  complianceName: string,
  complianceDescription: string,
  expiryDate?: Date,
  userId?: number,
  userEmail?: string
) {
  try {
    const workbook = XLSX.read(await readFileBuffer(filePath));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json<CriteriaRow>(worksheet);

    if (!data || data.length === 0) {
      throw new Error("No data found in Excel file");
    }

    const [newCompliance] = await db
      .insert(Compliance)
      .values({
        name: complianceName,
        description: complianceDescription,
        created_at: new Date(),
        expiry_date: expiryDate || null,
      })
      .returning();

    console.log(
      `Created compliance: ${complianceName} with ID: ${newCompliance.id}`
    );

    if (userId && userEmail) {
      await logUserAction(
        userId,
        userEmail,
        `User ${userEmail} has Created Compliance ${complianceName} via Excel import`,
        "COMPLIANCE_CREATE",
        newCompliance.id
      );
    }

    const prefixToIdMap = new Map<string, number>();

    for (const row of data) {
      const level = calculateLevelFromPrefix(row.prefix);

      let parentId: number | null = null;
      const prefixParts = row.prefix.split(".");

      if (prefixParts.length > 1) {
        const parentPrefix = prefixParts.slice(0, -1).join(".");
        parentId = prefixToIdMap.get(parentPrefix) || null;
      }

      const [newCriteria] = await db
        .insert(Criteria)
        .values({
          compliance_id: newCompliance.id,
          parent_id: parentId,
          prefix: row.prefix,
          name: row.name,
          description: null, // Default to null since description is not provided
          level: level,
          pic_id: null, // No PIC assigned during import
          status: "in-progress", // Default status
          created_at: new Date(),
        })
        .returning();

      console.log(
        `Created criterion: ${row.prefix} - ${row.name} with ID: ${newCriteria.id} (Level: ${level})`
      );

      prefixToIdMap.set(row.prefix, newCriteria.id);
    }

    return {
      success: true,
      message: `Successfully imported compliance ${complianceName} with ${data.length} criteria`,
      complianceId: newCompliance.id,
    };
  } catch (error) {
    console.error("Error importing Excel file:", error);
    throw error;
  }
}

async function readFileBuffer(filePath: string): Promise<ArrayBuffer> {
  try {
    const fs = await import("fs/promises");
    const buffer = await fs.readFile(filePath);
    return Buffer.from(buffer).buffer;
  } catch (err) {
    console.error("Error reading file:", err);
    throw err;
  }
}
