import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";

export const User = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  avatar: text("avatar").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull(),
});
// Compliance Table
export const Compliance = pgTable("compliance", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  created_at: timestamp("created_at").notNull(),
  expiry_date: timestamp("expiry_date"),
});

// Criteria Table
export const Criteria = pgTable("criteria", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  prefix: varchar("prefix", { length: 255 }).notNull(),
  compliance_id: bigint("compliance_id", { mode: "number" })
    .notNull()
    .references(() => Compliance.id),
  parent_id: bigint("parent_id", { mode: "number" }).references(
    () => Criteria.id
  ),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  level: bigint("level", { mode: "number" }).notNull(),
  created_at: timestamp("created_at").notNull(),
  pic_id: bigint("pic_id", { mode: "number" }).references(() => User.id),
  status: varchar("status", { length: 255 }).notNull(),
});

// Tags Table
export const Tags = pgTable("tags", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  created_at: timestamp("created_at").notNull(),
});

// CriteriaTags Table (Junction table)
export const CriteriaTags = pgTable("criteria_tags", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  criteria_id: bigint("criteria_id", { mode: "number" })
    .notNull()
    .references(() => Criteria.id, { onDelete: "cascade" }),
  tag_id: bigint("tag_id", { mode: "number" })
    .notNull()
    .references(() => Tags.id, { onDelete: "cascade" }),
});

// Evidences Table
export const Evidences = pgTable("evidences", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  file_name: varchar("file_name", { length: 255 }).notNull(),
  file_path: varchar("file_path", { length: 255 }).notNull(),
  drive_file_id: varchar("drive_file_id", { length: 255 }).notNull().unique(),
  uploaded_by: bigint("uploaded_by", { mode: "number" }).notNull(),
  uploaded_at: timestamp("uploaded_at").notNull(),
  expired_by: timestamp("expired_by").notNull(),
  notified: boolean("notified").default(false).notNull(),
});

// EvidenceCriteria Table (Junction table)
export const EvidenceCriteria = pgTable("evidence_criteria", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  criteria_id: bigint("criteria_id", { mode: "number" })
    .notNull()
    .references(() => Criteria.id, {onDelete: "cascade"}),
  evidence_id: bigint("evidence_id", { mode: "number" })
    .notNull()
    .references(() => Evidences.id),
  added_at: timestamp("added_at").notNull(),
});

// ComplianceAccess Table
export const ComplianceAccess = pgTable("compliance_access", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  compliance_id: bigint("compliance_id", { mode: "number" })
    .notNull()
    .references(() => Compliance.id),
  auditor_id: bigint("auditor_id", { mode: "number" })
    .notNull()
    .references(() => User.id),
  accessible: boolean("accessible").notNull(),
});

// CriteriaComment Table
export const CriteriaComment = pgTable("criteria_comment", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  criteria_id: bigint("criteria_id", { mode: "number" })
    .notNull()
    .references(() => Criteria.id , {onDelete: "cascade"}),
  user_id: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => User.id),
  comment: varchar("comment", { length: 255 }).notNull(),
  created_at: timestamp("created_at").notNull(),
});

// Logs Table
export const Logs = pgTable("logs", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  user_id: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => User.id),
  email: varchar("email", { length: 255 })
    .notNull()
    .references(() => User.email),
  compliance_id: bigint("compliance_id", { mode: "number" })
    .references(() => Compliance.id, { onDelete: "set null" }),
  category: varchar("category", { length: 100 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const UserRelations = relations(User, ({ many }) => ({
  complianceAccesses: many(ComplianceAccess),
  comments: many(CriteriaComment),
  logs: many(Logs),
}));

export const ComplianceRelations = relations(Compliance, ({ many }) => ({
  criteria: many(Criteria),
  accesses: many(ComplianceAccess),
}));

export const CriteriaRelations = relations(Criteria, ({ one, many }) => ({
  compliance: one(Compliance, {
    fields: [Criteria.compliance_id],
    references: [Compliance.id],
  }),
  parent: one(Criteria, {
    fields: [Criteria.parent_id],
    references: [Criteria.id],
    relationName: "criteria_parent_relation",
  }),
  children: many(Criteria, {
    fields: [Criteria.id],
    references: [Criteria.parent_id],
    relationName: "criteria_parent_relation",
  }),
  tags: many(CriteriaTags),
  evidences: many(EvidenceCriteria),
  comments: many(CriteriaComment),
  pic: one(User, {
    fields: [Criteria.pic_id],
    references: [User.id],
  }),
}));

export const CriteriaTagsRelations = relations(CriteriaTags, ({ one }) => ({
  criteria: one(Criteria, {
    fields: [CriteriaTags.criteria_id],
    references: [Criteria.id],
  }),
  tag: one(Tags, {
    fields: [CriteriaTags.tag_id],
    references: [Tags.id],
  }),
}));

export const EvidencesRelations = relations(Evidences, ({ many }) => ({
  criteria: many(EvidenceCriteria),
}));

export const EvidenceCriteriaRelations = relations(
  EvidenceCriteria,
  ({ one }) => ({
    criteria: one(Criteria, {
      fields: [EvidenceCriteria.criteria_id],
      references: [Criteria.id],
    }),
    evidence: one(Evidences, {
      fields: [EvidenceCriteria.evidence_id],
      references: [Evidences.id],
    }),
  })
);

export const ComplianceAccessRelations = relations(
  ComplianceAccess,
  ({ one }) => ({
    compliance: one(Compliance, {
      fields: [ComplianceAccess.compliance_id],
      references: [Compliance.id],
    }),
    auditor: one(User, {
      fields: [ComplianceAccess.auditor_id],
      references: [User.id],
    }),
  })
);

export const CriteriaCommentRelations = relations(
  CriteriaComment,
  ({ one }) => ({
    criteria: one(Criteria, {
      fields: [CriteriaComment.criteria_id],
      references: [Criteria.id],
    }),
    user: one(User, {
      fields: [CriteriaComment.user_id],
      references: [User.id],
    }),
  })
);

export const LogsRelations = relations(Logs, ({ one }) => ({
  user: one(User, {
    fields: [Logs.user_id],
    references: [User.id],
  }),
  compliance: one(Compliance, {
    fields: [Logs.compliance_id],
    references: [Compliance.id],
  }),
}));
