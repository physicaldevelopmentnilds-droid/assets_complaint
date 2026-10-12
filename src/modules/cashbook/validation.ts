import { z } from "zod";
import { assertBusinessDate } from "@/lib/dates";
import { CASHBOOK_START_DATE, parseNairaToKobo } from "@/lib/money";

export const transactionSchema = z.object({
  transactionDate: z.string(),
  description: z.string().trim().min(1).max(1000),
  type: z.enum(["Income", "Expenditure"]),
  amount: z.string(),
  receiptReference: z.string().trim().max(200).default(""),
  idempotencyKey: z.uuid()
}).strict().superRefine((value, ctx) => {
  try { assertBusinessDate(value.transactionDate); if (value.transactionDate < CASHBOOK_START_DATE) throw new Error(); }
  catch { ctx.addIssue({ code: "custom", path: ["transactionDate"], message: `Date must be on or after ${CASHBOOK_START_DATE}.` }); }
  try { parseNairaToKobo(value.amount); }
  catch { ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter a positive amount with at most two decimals." }); }
});

export const voidSchema = z.object({ reason: z.string().trim().min(1).max(1000) }).strict();
