import { z } from "zod";
import { currentStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { complaintFilters } from "@/modules/complaints/filters";
import { complaintPdf, type ComplaintReportRow } from "@/reports/complaints";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (!await currentStaff()) return new Response("UNAUTHORIZED", { status: 401 });
    const params = new URL(request.url).searchParams;
    const { query } = complaintFilters(params);
    const rows = await (await database()).collection("assetComplaints").find(query).sort({ submittedAt: 1, _id: 1 }).toArray();
    const filters = Array.from(params.entries()).filter(([key]) => key !== "page").map(([key, value]) => `${key}: ${value}`).join("; ");
    const bytes = await complaintPdf(rows as unknown as ComplaintReportRow[], "Assets Complaint Report", filters, false);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=asset-complaints-report.pdf", "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return new Response("Invalid filters", { status: 400 });
    throw error;
  }
}
