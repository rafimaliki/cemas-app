import { z } from "zod";



// Query parameter schemas
export const getUserParamsSchema = z.object({
  id: z.string().refine(val => !Number.isNaN(Number(val)), {
    message: "ID must be a valid number"
  })
});

