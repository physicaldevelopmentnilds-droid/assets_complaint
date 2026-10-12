import { z } from "zod";
const filtersSchema = z.object({
  search: z.string().trim().max(200).default(""),
  reviewed: z.enum(["true", "false"]).optional(),
  approved: z.enum(["true", "false"]).optional(),
  submittedToRegistry: z.enum(["true", "false"]).optional(),
  projectExecuted: z.enum(["true", "false"]).optional(),
  progressMin: z.coerce.number().int().min(0).max(100).optional(),
  progressMax: z.coerce.number().int().min(0).max(100).optional(),
  registryFrom: z.iso.date().optional(),
  registryTo: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1)
}).refine((v) => v.progressMin == null || v.progressMax == null || v.progressMin <= v.progressMax).refine((v) => !v.registryFrom || !v.registryTo || v.registryFrom <= v.registryTo);

export function memoFilters(params: URLSearchParams) {
  const entries = Object.fromEntries(params.entries());
  for (const [key, value] of Object.entries(entries)) if (value === "") delete entries[key];
  const parsed = filtersSchema.parse(entries);
  const query: Record<string, unknown> = {};
  for (const key of ["reviewed", "approved", "submittedToRegistry", "projectExecuted"] as const) if (parsed[key]) query[key] = parsed[key] === "true";
  if (parsed.progressMin != null || parsed.progressMax != null) query.projectProgress = { ...(parsed.progressMin != null ? { $gte: parsed.progressMin } : {}), ...(parsed.progressMax != null ? { $lte: parsed.progressMax } : {}) };
  if (parsed.registryFrom || parsed.registryTo) query.registryDate = { ...(parsed.registryFrom ? { $gte: parsed.registryFrom } : {}), ...(parsed.registryTo ? { $lte: parsed.registryTo } : {}) };
  if (parsed.search) {
    const escaped = parsed.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = ["subject", "draftedBy", "recipient", "reference"].map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  }
  return { parsed, query };
}
