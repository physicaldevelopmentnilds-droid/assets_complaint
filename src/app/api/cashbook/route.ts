import { z } from "zod";
import { assertSameOrigin, errorResponse, requireCashbook } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
import { ensureIndexes } from "@/lib/indexes";
import { nextNumber, nextReference } from "@/lib/sequences";
import { parseNairaToKobo } from "@/lib/money";
import { transactionSchema } from "@/modules/cashbook/validation";
import { cashbookFilters } from "@/modules/cashbook/filters";
import { calculateLedger, type CashbookEntry } from "@/modules/cashbook/ledger";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const actor = await requireCashbook();
    await ensureIndexes();
    const input = transactionSchema.parse(await request.json());
    const db = await database();
    const existing = await db.collection("cashbookSubmissionKeys").findOne({ key: input.idempotencyKey, actorId: actor.id, expiresAt: { $gt: new Date() } });
    if (existing) return Response.json({ reference: existing.reference });
    const amountKobo = parseNairaToKobo(input.amount);
    const reference = await nextReference("CASH", Number(input.transactionDate.slice(0, 4)));
    const sequence = await nextNumber("cashbook-order");
    const now = new Date();
    const session = (await mongoClient()).startSession();
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("cashbookTransactions").insertOne({ reference, sequence, transactionDate: input.transactionDate, description: input.description, type: input.type, amountKobo, receiptReference: input.receiptReference || null, voidedAt: null, voidReason: null, voidedBy: null, createdAt: now, createdBy: actor.id }, { session });
        await db.collection("cashbookSubmissionKeys").insertOne({ key: input.idempotencyKey, actorId: actor.id, reference, createdAt: now, expiresAt: new Date(now.getTime() + 24 * 60 * 60_000) }, { session });
        await db.collection("auditLogs").insertOne({ action: "cashbook.created", actorId: actor.id, targetId: result.insertedId, at: now, details: { reference, type: input.type, amountKobo } }, { session });
      });
    } finally { await session.endSession(); }
    return Response.json({ reference }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid transaction", fields: error.flatten().fieldErrors }, { status: 400 });
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return Response.json({ error: "Submission already in progress. Retry shortly." }, { status: 409 });
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    await requireCashbook();
    const filters = cashbookFilters(new URL(request.url).searchParams);
    const db = await database();
    const query = filters.to ? { transactionDate: { $lte: filters.to } } : {};
    const entries = await db.collection("cashbookTransactions").find(query).sort({ transactionDate: 1, sequence: 1 }).toArray();
    const ledger = calculateLedger(entries as unknown as CashbookEntry[], filters);
    return Response.json({ ...ledger, rows: ledger.rows.slice((filters.page - 1) * 25, filters.page * 25), total: ledger.rows.length, page: filters.page, pageSize: 25 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid filters" }, { status: 400 });
    return errorResponse(error);
  }
}
