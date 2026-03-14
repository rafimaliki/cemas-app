import { z } from "zod";

export const ComplianceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  expiry_date: z.string().datetime().optional()
});