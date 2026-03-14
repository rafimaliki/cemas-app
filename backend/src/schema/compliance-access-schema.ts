import { z } from "zod";

export const ComplianceAccessSchema = z.object({
  compliance_id: z.number().min(1, "Compliance ID is required"),
  auditor_id: z.number().min(1, "Auditor ID is required"), 
  accessible: z.boolean({
    required_error: "Accessible status is required",
    invalid_type_error: "Accessible must be a boolean"
  })
});