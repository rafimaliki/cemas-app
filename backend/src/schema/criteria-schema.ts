import { z } from "zod";

export const CriteriaSchema = z.object({
  compliance_id: z.number().min(1, "Compliance ID is required").nullable(),
  parent_id: z.number().nonnegative().nullable(),
  prefix: z.string().min(1).nullable(),
  name: z.string().min(1, "Name is required").nullable(),
  description: z.string().nullable(),
  level: z
    .number()
    .int()
    .nonnegative("Level must be a non-negative integer")
    .nullable(),
  pic_id: z.number().nonnegative().nullable(),
  status: z.string().min(1, "Status is required").nullable(),
});
