import { z } from "zod";
import { requireCashbook, errorResponse } from "@/lib/auth";
import { database } from "@/lib/db";
import { cashbookFilters } from "@/modules/cashbook/filters";
import { type CashbookEntry } from "@/modules/cashbook/ledger";
import { cashbookPdf } from "@/reports/cashbook";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireCashbook();
    const params = new URL(request.url).searchParams;
    const filters = cashbookFilters(params);
    const entries = await (await database()).collection("cashbookTransactions").find(filters.to ? { transactionDate: { $lte: filters.to } } : {}).sort({ transactionDate: 1, sequence: 1 }).toArray();
    const labels = Array.from(params.entries()).filter(([key]) => key !== "page").map(([key, value]) => `${key}: ${value}`).join("; ");
    const bytes = await cashbookPdf(entries as unknown as CashbookEntry[], filters, labels);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=cashbook-report.pdf", "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return new Response("Invalid filters", { status: 400 });
    return errorResponse(error);
  }
}
