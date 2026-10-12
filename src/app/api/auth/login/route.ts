import bcrypt from "bcryptjs";
import { z } from "zod";
import { createHash } from "node:crypto";
import { database } from "@/lib/db";
import { ensureIndexes } from "@/lib/indexes";
import { assertSameOrigin, issueSession, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(1024) }).strict();

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    await ensureIndexes();
    const input = schema.parse(await request.json());
    const db = await database();
    const email = input.email.trim().toLowerCase();
    const peer = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHash("sha256").update(`${peer}:${email}`).digest("hex");
    const now = new Date();
    const blocked = await db.collection("rateLimits").findOne({ key, expiresAt: { $gt: now }, attempts: { $gte: 5 } });
    if (blocked) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    const user = await db.collection("users").findOne({ normalizedEmail: email, active: true });
    const valid = user?.passwordHash ? await bcrypt.compare(input.password, String(user.passwordHash)) : false;
    if (!valid) {
      await db.collection("rateLimits").updateOne({ key }, { $inc: { attempts: 1 }, $set: { expiresAt: new Date(Date.now() + 15 * 60_000) } }, { upsert: true });
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await db.collection("rateLimits").deleteOne({ key });
    await issueSession(user!._id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid input" }, { status: 400 });
    return errorResponse(error);
  }
}
