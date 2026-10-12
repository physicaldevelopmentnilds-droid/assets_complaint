import { z } from "zod";
import { lagosDayBounds } from "@/lib/dates";
import { BUILDING_SECTIONS, COMPLAINT_TYPES, HANDLING_STATUSES } from "./validation";

const schema = z.object({
  search: z.string().trim().max(200).default(""),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  complaintType: z.enum(COMPLAINT_TYPES).optional(),
  buildingSection: z.enum(BUILDING_SECTIONS).optional(),
  submissionType: z.enum(["First complaint", "Reminder"]).optional(),
  handlingStatus: z.enum(HANDLING_STATUSES).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1)
}).refine((value) => !value.from || !value.to || value.from <= value.to, { message: "The end date must be on or after the start date." });

export function complaintFilters(searchParams: URLSearchParams) {
  const entries = Object.fromEntries(searchParams.entries());
  for (const [key, value] of Object.entries(entries)) if (value === "") delete entries[key];
  const parsed = schema.parse(entries);
  const query: Record<string, unknown> = {};
  if (parsed.complaintType) query.complaintType = parsed.complaintType;
  if (parsed.buildingSection) query.buildingSection = parsed.buildingSection;
  if (parsed.submissionType) query.submissionType = parsed.submissionType;
  if (parsed.handlingStatus) query.handlingStatus = parsed.handlingStatus;
  if (parsed.from || parsed.to) {
    query.submittedAt = {
      ...(parsed.from ? { $gte: lagosDayBounds(parsed.from).start } : {}),
      ...(parsed.to ? { $lt: lagosDayBounds(parsed.to).endExclusive } : {})
    };
  }
  if (parsed.search) {
    const escaped = parsed.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = ["reference", "complainantName", "description", "officeNumber"].map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  }
  return { parsed, query };
}
