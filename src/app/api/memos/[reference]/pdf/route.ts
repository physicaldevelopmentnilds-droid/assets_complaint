import { currentStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { memoPdf, type MemoReportRow } from "@/reports/memos";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!await currentStaff()) return new Response("UNAUTHORIZED", { status: 401 });
  const { reference } = await params;
  const row = await (await database()).collection("memos").findOne({ reference });
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = await memoPdf([row as unknown as MemoReportRow], "Memo Tracking Record", `Reference: ${reference}`);
  return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${reference}.pdf"`, "cache-control": "private, no-store" } });
}
