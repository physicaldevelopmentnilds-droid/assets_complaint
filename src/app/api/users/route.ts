import bcrypt from "bcryptjs";
import { z } from "zod";
import { assertSameOrigin, errorResponse, requireAdmin } from "@/lib/auth";
import { database, mongoClient } from "@/lib/db";
export const runtime = "nodejs";
const schema = z.object({ email: z.email().max(254), name: z.string().trim().min(1).max(120), password: z.string().min(12).max(1024) }).strict();

export async function GET() {
  try {
    await requireAdmin();
    const users = await (await database()).collection("users").find({ active: true }, { projection: { email: 1, name: 1, role: 1, cashbookAccess: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(200).toArray();
    return Response.json({ users: users.map((user) => ({ id: String(user._id), email: user.email, name: user.name, role: user.role, cashbookAccess: user.cashbookAccess === true })) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const actor = await requireAdmin();
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    const db = await database();
    const now = new Date();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const session = (await mongoClient()).startSession();
    let id = "";
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("users").insertOne({ email: input.email, normalizedEmail: email, name: input.name, passwordHash, role: "officer", cashbookAccess: false, active: true, createdAt: now, updatedAt: now }, { session });
        id = String(result.insertedId);
        await db.collection("auditLogs").insertOne({ action: "user.created", actorId: actor.id, targetId: result.insertedId, at: now, details: { role: "officer" } }, { session });
      });
    } finally { await session.endSession(); }
    return Response.json({ id, role: "officer" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid input" }, { status: 400 });
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return Response.json({ error: "Email already exists" }, { status: 409 });
    return errorResponse(error);
  }
}
