import { z } from "zod";
import { currentStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { memoFilters } from "@/modules/memos/filters";
import { memoPdf, type MemoReportRow } from "@/reports/memos";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (!await currentStaff()) return new Response("UNAUTHORIZED", { status: 401 });
    const params = new URL(request.url).searchParams;
    const { query } = memoFilters(params);
    const rows = await (await database()).collection("memos").find(query).sort({ createdAt: 1, _id: 1 }).toArray();
    const filters = Array.from(params.entries()).filter(([key]) => key !== "page").map(([key, value]) => `${key}: ${value}`).join("; ");
    const bytes = await memoPdf(rows as unknown as MemoReportRow[], "Memo Tracking Report", filters);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=memo-tracking-report.pdf", "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return new Response("Invalid filters", { status: 400 });
    throw error;
  }
}
