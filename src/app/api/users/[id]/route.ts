import { ObjectId } from "mongodb";
import { z } from "zod";
import { assertSameOrigin, errorResponse, requireAdmin } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
export const runtime = "nodejs";
const schema = z.object({ cashbookAccess: z.boolean() }).strict();

async function change(request: Request, id: string, remove: boolean) {
  try {
    await assertSameOrigin();
    const actor = await requireAdmin();
    if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid officer" }, { status: 400 });
    const input = remove ? null : schema.parse(await request.json());
    const db = await database();
    const session = (await mongoClient()).startSession();
    let found = false;
    try {
      await session.withTransaction(async () => {
        found = false;
        const previous = await db.collection("users").findOneAndUpdate(
          { _id: new ObjectId(id), role: "officer", active: true },
          { $set: remove ? { active: false, cashbookAccess: false, removedAt: new Date(), removedBy: actor.id, updatedAt: new Date() } : { cashbookAccess: input!.cashbookAccess, updatedAt: new Date() } },
          { session, returnDocument: "before" }
        );
        if (!previous) return;
        found = true;
        if (remove) {
          await db.collection("sessions").deleteMany({ userId: previous._id }, { session });
          await db.collection("pushSubscriptions").deleteMany({ ownerId: id }, { session });
        }
        await db.collection("auditLogs").insertOne({ action: remove ? "user.removed" : "user.cashbook-access.changed", actorId: actor.id, targetId: id, at: new Date(), details: remove ? {} : { previous: previous.cashbookAccess === true, cashbookAccess: input!.cashbookAccess } }, { session });
      });
    } finally { await session.endSession(); }
    return found ? Response.json({ ok: true }) : Response.json({ error: "Active officer not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid permission" }, { status: 400 });
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return change(request, (await params).id, false); }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { return change(request, (await params).id, true); }
