import { z } from "zod";
const schema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  type: z.enum(["Income", "Expenditure"]).optional(),
  search: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1)
}).refine((value) => !value.from || !value.to || value.from <= value.to);
export function cashbookFilters(params: URLSearchParams) {
  const entries = Object.fromEntries(params.entries());
  for (const [key, value] of Object.entries(entries)) if (value === "") delete entries[key];
  return schema.parse(entries);
}
