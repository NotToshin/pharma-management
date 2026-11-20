import { z } from "zod"

export const bankAccountFormSchema = z.object({
  accountTitle: z.string().trim().min(1, "Account title is required"),
  category: z.enum(["BANK", "CASH"]),
  institution: z.string().trim().min(1, "Institution or drawer name is required"),
  accountNumber: z.string().trim().min(1, "Account number or vault identifier is required"),
  branch: z.string().trim().optional(),
  accountClass: z.string().trim().min(1, "Account class is required"),
  balance: z.coerce.number({ message: "Balance must be a number" }),
})

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>
