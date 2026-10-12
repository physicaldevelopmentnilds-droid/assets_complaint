import { ObjectId } from "mongodb";
import { assertSameOrigin, errorResponse, requireAdmin } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
    const actor = await requireAdmin();
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid user" }, { status: 400 });
    const db = await database();
    const now = new Date();
    const session = (await mongoClient()).startSession();
    let promoted = false;
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("users").updateOne({ _id: new ObjectId(id), role: "officer", active: true }, { $set: { role: "admin", updatedAt: now } }, { session });
        if (!result.modifiedCount) return;
        promoted = true;
        await db.collection("auditLogs").insertOne({ action: "user.promoted", actorId: actor.id, targetId: id, at: now }, { session });
      });
    } finally { await session.endSession(); }
    if (!promoted) return Response.json({ error: "Officer not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
