import { z } from "zod";
import { assertSameOrigin, currentSessionHash, errorResponse, requireStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { ensureIndexes } from "@/lib/indexes";
import { subscriptionSchema, validatePushEndpoint } from "@/modules/push/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const staff = await requireStaff();
    const sessionTokenHash = await currentSessionHash();
    if (!sessionTokenHash) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const input = subscriptionSchema.parse(await request.json());
    const endpointHash = validatePushEndpoint(input.endpoint);
    await ensureIndexes();
    const db = await database();
    await db.collection("pushSubscriptions").updateOne({ endpointHash }, { $set: { endpoint: input.endpoint, keys: input.keys, expirationTime: input.expirationTime ?? null, ownerId: staff.id, sessionTokenHash, active: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid subscription" }, { status: 400 });
    if (error instanceof Error && error.message === "Unsupported push endpoint.") return Response.json({ error: error.message }, { status: 400 });
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await assertSameOrigin();
    const staff = await requireStaff();
    const sessionTokenHash = await currentSessionHash();
    const body = z.object({ endpoint: z.url().max(2048) }).strict().parse(await request.json());
    const endpointHash = validatePushEndpoint(body.endpoint);
    await (await database()).collection("pushSubscriptions").deleteOne({ endpointHash, ownerId: staff.id, sessionTokenHash });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid subscription" }, { status: 400 });
    return errorResponse(error);
  }
}
