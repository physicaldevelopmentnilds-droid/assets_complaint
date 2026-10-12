import { z } from "zod";
import { assertSameOrigin, errorResponse, requireCashbook } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
import { voidSchema } from "@/modules/cashbook/validation";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    await assertSameOrigin();
    const actor = await requireCashbook();
    const { reason } = voidSchema.parse(await request.json());
    const { reference } = await params;
    const db = await database();
    const now = new Date();
    const session = (await mongoClient()).startSession();
    let found = false;
    try {
      await session.withTransaction(async () => {
        const previous = await db.collection("cashbookTransactions").findOneAndUpdate({ reference, voidedAt: null }, { $set: { voidedAt: now, voidReason: reason, voidedBy: actor.id } }, { returnDocument: "before", session });
        if (!previous) return;
        found = true;
        await db.collection("auditLogs").insertOne({ action: "cashbook.voided", actorId: actor.id, targetId: previous._id, at: now, details: { reference, reason } }, { session });
      });
    } finally { await session.endSession(); }
    return found ? Response.json({ ok: true }) : Response.json({ error: "Active transaction not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Void reason required" }, { status: 400 });
    return errorResponse(error);
  }
}
