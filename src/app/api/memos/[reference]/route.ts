import { z } from "zod";
import { assertSameOrigin, errorResponse, requireStaff } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
import { memoPatchSchema, memoSchema, normalizeMemo } from "@/modules/memos/validation";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    await requireStaff();
    const { reference } = await params;
    const row = await (await database()).collection("memos").findOne({ reference });
    return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    await assertSameOrigin();
    const actor = await requireStaff();
    const patch = memoPatchSchema.parse(await request.json());
    const { reference } = await params;
    const db = await database();
    const session = (await mongoClient()).startSession();
    let found = false;
    try {
      await session.withTransaction(async () => {
        const before = await db.collection("memos").findOne({ reference }, { session });
        if (!before) return;
        found = true;
        const merged = normalizeMemo(memoSchema.parse({
          subject: before.subject, draftedBy: before.draftedBy, recipient: before.recipient,
          reviewed: before.reviewed, approved: before.approved, submittedToRegistry: before.submittedToRegistry,
          registryDate: before.registryDate, projectProgress: before.projectProgress, projectExecuted: before.projectExecuted,
          ...patch
        }));
        const now = new Date();
        await db.collection("memos").updateOne({ _id: before._id }, { $set: { ...merged, updatedAt: now, updatedBy: actor.id } }, { session });
        await db.collection("auditLogs").insertOne({ action: "memo.updated", actorId: actor.id, targetId: before._id, at: now, details: { before: { registryDate: before.registryDate, projectProgress: before.projectProgress, projectExecuted: before.projectExecuted, reviewed: before.reviewed, approved: before.approved, submittedToRegistry: before.submittedToRegistry }, after: { registryDate: merged.registryDate, projectProgress: merged.projectProgress, projectExecuted: merged.projectExecuted, reviewed: merged.reviewed, approved: merged.approved, submittedToRegistry: merged.submittedToRegistry } } }, { session });
      });
    } finally { await session.endSession(); }
    return found ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid memo", fields: error.flatten().fieldErrors }, { status: 400 });
    return errorResponse(error);
  }
}
