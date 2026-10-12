import { z } from "zod";
import { assertSameOrigin, errorResponse, requireStaff } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
import { HANDLING_STATUSES } from "@/modules/complaints/validation";
export const runtime = "nodejs";
const patchSchema = z.object({ handlingStatus: z.enum(HANDLING_STATUSES) }).strict();

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    await requireStaff();
    const { reference } = await params;
    const row = await (await database()).collection("assetComplaints").findOne({ reference }, { projection: { peerHash: 0, idempotencyKey: 0, "image.assetUrl": 0 } });
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(row);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    await assertSameOrigin();
    const actor = await requireStaff();
    const input = patchSchema.parse(await request.json());
    const { reference } = await params;
    if (!/^ASSET-\d{4}-\d{6}$/.test(reference)) return Response.json({ error: "Invalid reference" }, { status: 400 });
    const db = await database();
    const now = new Date();
    const session = (await mongoClient()).startSession();
    let found = false;
    try {
      await session.withTransaction(async () => {
        const previous = await db.collection("assetComplaints").findOneAndUpdate({ reference }, { $set: { handlingStatus: input.handlingStatus, updatedAt: now } }, { returnDocument: "before", session });
        if (!previous) return;
        found = true;
        if (previous.handlingStatus !== input.handlingStatus) await db.collection("auditLogs").insertOne({ action: "complaint.statusChanged", actorId: actor.id, targetId: previous._id, at: now, details: { from: previous.handlingStatus, to: input.handlingStatus } }, { session });
      });
    } finally { await session.endSession(); }
    if (!found) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid status" }, { status: 400 });
    return errorResponse(error);
  }
}
