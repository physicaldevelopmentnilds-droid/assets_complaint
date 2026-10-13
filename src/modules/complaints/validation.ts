import { z } from "zod";

export const COMPLAINT_TYPES = ["Furniture", "Appliance", "Structural Defects", "Facilities (e.g. Toilet, Kitchenette)", "Electrical Components (e.g. Switch, Light, Socket)", "Mechanical (A/C, Plumbing)", "Other"] as const;
export const BUILDING_SECTIONS = ["Reception Hall", "Administrative Block", "Lecture Theatre (Lecture Halls and Open Arena)", "Library Block", "Convention Centre", "Clinic", "Car Park and Landscape", "Generator house", "Water treatment plant", "Sewage treatment plant", "Other"] as const;
export const HANDLING_STATUSES = ["Received", "In progress", "Resolved"] as const;

const required = z.string().trim().min(1).max(500);
export const complaintSchema = z.object({
  complaintType: z.enum(COMPLAINT_TYPES),
  complaintTypeOther: z.string().trim().max(200).default(""),
  description: z.string().trim().min(1).max(10000),
  submissionType: z.enum(["First complaint", "Reminder"]),
  previousReference: z.string().trim().max(40).default(""),
  buildingSection: z.enum(BUILDING_SECTIONS),
  buildingSectionOther: z.string().trim().max(200).default(""),
  floor: required,
  officeNumber: z.string().trim().max(500).default(""),
  complainantName: required,
  department: required,
  designation: required,
  contactNumber: z.string().trim().min(5).max(40).regex(/^[+\d()\s-]+$/)
}).strict().superRefine((data, ctx) => {
  if (data.complaintType === "Other" && !data.complaintTypeOther) ctx.addIssue({ code: "custom", path: ["complaintTypeOther"], message: "Specify the complaint type." });
  if (data.buildingSection === "Other" && !data.buildingSectionOther) ctx.addIssue({ code: "custom", path: ["buildingSectionOther"], message: "Specify the building section." });
  if (data.submissionType !== "Reminder" && data.previousReference) ctx.addIssue({ code: "custom", path: ["previousReference"], message: "Reference only applies to reminders." });
});
export type ComplaintInput = z.infer<typeof complaintSchema>;
