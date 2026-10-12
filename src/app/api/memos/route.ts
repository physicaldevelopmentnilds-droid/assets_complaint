import { z } from "zod";
import { assertSameOrigin, errorResponse, requireStaff } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
import { nextReference } from "@/lib/sequences";
import { lagosDate } from "@/lib/dates";
import { memoSchema, normalizeMemo } from "@/modules/memos/validation";
import { memoFilters } from "@/modules/memos/filters";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const actor = await requireStaff();
    const input = normalizeMemo(memoSchema.parse(await request.json()));
    const now = new Date();
    const reference = await nextReference("MEMO", Number(lagosDate(now).slice(0, 4)));
    const db = await database();
    const session = (await mongoClient()).startSession();
    let id = "";
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("memos").insertOne({ ...input, reference, createdAt: now, updatedAt: now, createdBy: actor.id, updatedBy: actor.id }, { session });
        id = String(result.insertedId);
        await db.collection("auditLogs").insertOne({ action: "memo.created", actorId: actor.id, targetId: result.insertedId, at: now, details: { reference } }, { session });
      });
    } finally { await session.endSession(); }
    return Response.json({ id, reference }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid memo", fields: error.flatten().fieldErrors }, { status: 400 });
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { parsed, query } = memoFilters(new URL(request.url).searchParams);
    const collection = (await database()).collection("memos");
    const [rows, total] = await Promise.all([collection.find(query).sort({ createdAt: -1, _id: -1 }).skip((parsed.page - 1) * 25).limit(25).toArray(), collection.countDocuments(query)]);
    return Response.json({ rows, total, page: parsed.page, pageSize: 25 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid filters" }, { status: 400 });
    return errorResponse(error);
  }
}
