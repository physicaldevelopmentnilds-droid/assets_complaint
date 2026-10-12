import { currentStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { complaintPdf, type ComplaintReportRow } from "@/reports/complaints";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!await currentStaff()) return new Response("UNAUTHORIZED", { status: 401 });
  const { reference } = await params;
  const row = await (await database()).collection("assetComplaints").findOne({ reference });
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = await complaintPdf([row as unknown as ComplaintReportRow], "Asset Complaint", `Reference: ${reference}`, true);
  return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${reference}.pdf"`, "cache-control": "private, no-store" } });
}
