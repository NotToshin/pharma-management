import { z } from "zod"

export const territoryFormSchema = z.object({
  name: z.string().trim().min(1, "Territory name is required").max(200),
  division: z.string().trim().max(200).optional(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
}).strict()
