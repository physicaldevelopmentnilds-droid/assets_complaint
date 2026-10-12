import { z } from "zod";
import { assertBusinessDate } from "@/lib/dates";

const base = z.object({
  subject: z.string().trim().min(1).max(500),
  draftedBy: z.string().trim().min(1).max(200),
  recipient: z.string().trim().min(1).max(200),
  reviewed: z.boolean().default(false),
  approved: z.boolean().default(false),
  submittedToRegistry: z.boolean().default(false),
  registryDate: z.string().nullable().default(null),
  projectProgress: z.number().int().min(0).max(100).default(0),
  projectExecuted: z.boolean().default(false)
}).strict();

export const memoSchema = base.superRefine((value, ctx) => {
  if (value.submittedToRegistry && !value.registryDate) ctx.addIssue({ code: "custom", path: ["registryDate"], message: "Registry date is required." });
  if (value.registryDate) {
    try { assertBusinessDate(value.registryDate); }
    catch { ctx.addIssue({ code: "custom", path: ["registryDate"], message: "Invalid date." }); }
  }
  if (value.projectExecuted !== (value.projectProgress === 100)) ctx.addIssue({ code: "custom", path: ["projectProgress"], message: "Executed and progress must agree." });
});
export type MemoInput = z.infer<typeof memoSchema>;

export const memoPatchSchema = base.partial().strict();

export function normalizeMemo(input: MemoInput): MemoInput {
  return { ...input, registryDate: input.submittedToRegistry ? input.registryDate : null };
}
