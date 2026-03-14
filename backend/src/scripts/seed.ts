import { db } from "../db/index.ts";
import { Compliance, Criteria, CriteriaTags, Tags, User } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export async function seedUsers() {
  const emails = [
    "13522127@std.stei.itb.ac.id",
    "13522129@std.stei.itb.ac.id",
    "13522136@std.stei.itb.ac.id",
    "13522137@std.stei.itb.ac.id",
    "13522138@std.stei.itb.ac.id",
    "yudis@staff.stei.itb.ac.id",
    "galuh@staff.stei.itb.ac.id",
  ];

  try {
    for (const email of emails) {
      const name = email.split("@")[0];

      const exists = await db.select().from(User).where(eq(User.email, email));
      if (exists.length === 0) {
        await db.insert(User).values({
          name,
          email,
          avatar: "",
          role: "Administrator",
          status: "Active",
          createdAt: new Date(),
        });
        console.log(`✅ Seeded user: ${name} (${email})`);
      } else {
        console.log(`ℹ️ User already exists: ${email}`);
      }
    }
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

export async function seedCompliance() {
  // Sample data for Compliance table
  const compliances = [
    { 
      name: "ISO 9001", 
      description: "Quality Management System",
      expiry_date: new Date("2026-12-31") 
    },
    { 
      name: "ISO 27001", 
      description: "Information Security Management",
      expiry_date: new Date("2025-12-31") 
    },
  ];

  // Sample data for Criteria table
  const criteria = [
    { complianceName: "ISO 9001", prefix: "1", name: "Process Management", description: "Criteria for process management", level: 1, status: "Active" },
    { complianceName: "ISO 9001", prefix: "1.1", name: "Customer Satisfaction", description: "Criteria for customer satisfaction", level: 2, status: "Active" },
    { complianceName: "ISO 27001", prefix: "1", name: "Access Control", description: "Criteria for access control", level: 1, status: "Active" },
    { complianceName: "ISO 27001", prefix: "1.1", name: "Risk Assessment", description: "Criteria for risk assessment", level: 2, status: "Active" },
  ];

  // Sample data for Tags table
  const tags = [
    { name: "Process", description: "Process-related criteria" },
    { name: "Customer", description: "Customer-related criteria" },
    { name: "Security", description: "Security-related criteria" },
    { name: "Risk", description: "Risk-related criteria" },
  ];

  try {
    // Seed Compliance table
    for (const compliance of compliances) {
      const exists = await db.select().from(Compliance).where(eq(Compliance.name, compliance.name));
      if (exists.length === 0) {
        await db.insert(Compliance).values({
          name: compliance.name,
          description: compliance.description,
          created_at: new Date(),
          expiry_date: compliance.expiry_date
        });
        console.log(`✅ Seeded compliance: ${compliance.name}`);
      } else {
        console.log(`ℹ️ Compliance already exists: ${compliance.name}`);
      }
    }

    // Seed Criteria table
    for (const criterion of criteria) {
      const complianceId = (await db.select().from(Compliance).where(eq(Compliance.name, criterion.complianceName)))[0]?.id;

      if (complianceId) {
        const exists = await db.select().from(Criteria).where(eq(Criteria.name, criterion.name));
        if (exists.length === 0) {
          await db.insert(Criteria).values({
            compliance_id: complianceId,
            name: criterion.name,
            description: criterion.description,
            level: criterion.level,
            created_at: new Date(),
            pic_id: 1, // Assuming user with ID 1 is the PIC
            status: criterion.status,
            prefix: criterion.prefix,
          });
          console.log(`✅ Seeded criterion: ${criterion.name}`);
        } else {
          console.log(`ℹ️ Criterion already exists: ${criterion.name}`);
        }
      }
    }

    // Seed Tags table
    for (const tag of tags) {
      const exists = await db.select().from(Tags).where(eq(Tags.name, tag.name));
      if (exists.length === 0) {
        await db.insert(Tags).values({
          name: tag.name,
          description: tag.description,
          created_at: new Date(),
        });
        console.log(`✅ Seeded tag: ${tag.name}`);
      } else {
        console.log(`ℹ️ Tag already exists: ${tag.name}`);
      }
    }

    // Seed CriteriaTags table
    const criteriaTags = [
      { criterionName: "Process Management", tagName: "Process" },
      { criterionName: "Customer Satisfaction", tagName: "Customer" },
      { criterionName: "Access Control", tagName: "Security" },
      { criterionName: "Risk Assessment", tagName: "Risk" },
    ];

    for (const criteriaTag of criteriaTags) {
      const criterionId = (await db.select().from(Criteria).where(eq(Criteria.name, criteriaTag.criterionName)))[0]?.id;
      const tagId = (await db.select().from(Tags).where(eq(Tags.name, criteriaTag.tagName)))[0]?.id;

      if (criterionId && tagId) {
        const exists = await db.select().from(CriteriaTags).where(
          eq(CriteriaTags.criteria_id, criterionId) && eq(CriteriaTags.tag_id, tagId)
        );
        if (exists.length === 0) {
          await db.insert(CriteriaTags).values({
            criteria_id: criterionId,
            tag_id: tagId,
          });
          console.log(` Seeded criteria tag for: ${criteriaTag.criterionName} - ${criteriaTag.tagName}`);
        } else {
          console.log(` Criteria tag already exists: ${criteriaTag.criterionName} - ${criteriaTag.tagName}`);
        }
      }
    }
  } catch (error) {
    console.error("Error seeding compliance data:", error);
  }
}
