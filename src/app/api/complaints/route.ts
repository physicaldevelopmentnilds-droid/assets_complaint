import { createHash } from "node:crypto";
import { z } from "zod";
import { database, mongoClient } from "@/lib/db";
import { ensureIndexes } from "@/lib/indexes";
import { nextReference } from "@/lib/sequences";
import { lagosDate } from "@/lib/dates";
import { assertSameOrigin, currentStaff, errorResponse } from "@/lib/auth";
import { complaintSchema } from "@/modules/complaints/validation";
import { complaintFilters } from "@/modules/complaints/filters";
import { deleteComplaintImage, uploadComplaintImage, type ComplaintImage } from "@/modules/complaints/image";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let image: ComplaintImage | undefined;
  try {
    await assertSameOrigin();
    await ensureIndexes();
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 6 * 1024 * 1024) return Response.json({ error: "Submission is too large" }, { status: 413 });
    const db = await database();
    const peer = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const peerHash = createHash("sha256").update(peer).digest("hex");
    const now = new Date();
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Missing submission body" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 6 * 1024 * 1024) { await reader.cancel(); return Response.json({ error: "Submission is too large" }, { status: 413 }); }
      chunks.push(value);
    }
    const bounded = new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type") || "" }, body: Buffer.concat(chunks) });
    const form = await bounded.formData();
    const key = String(form.get("idempotencyKey") || "");
    if (!/^[a-f0-9-]{36}$/.test(key)) return Response.json({ error: "Invalid submission key" }, { status: 400 });
    const existing = await db.collection("submissionKeys").findOne({ key, peerHash, expiresAt: { $gt: now } }, { projection: { reference: 1 } });
    if (existing) return Response.json({ reference: existing.reference });
    const throttle = await db.collection("rateLimits").findOneAndUpdate({ key: `complaint:${peerHash}` }, { $inc: { attempts: 1 }, $set: { expiresAt: new Date(now.getTime() + 60 * 60_000) } }, { upsert: true, returnDocument: "after" });
    if (Number(throttle?.attempts) > 10) return Response.json({ error: "Submission limit reached. Try later." }, { status: 429 });
    const raw = Object.fromEntries(Array.from(form.entries()).filter(([name]) => name !== "picture" && name !== "idempotencyKey"));
    const input = complaintSchema.parse(raw);
    if (input.previousReference) {
      if (!/^ASSET-\d{4}-\d{6}$/.test(input.previousReference)) return Response.json({ error: "Invalid previous reference" }, { status: 400 });
      const previous = await db.collection("assetComplaints").findOne({ reference: input.previousReference }, { projection: { _id: 1 } });
      if (!previous) return Response.json({ error: "Invalid previous reference" }, { status: 400 });
    }
    const file = form.get("picture");
    if (file && !(file instanceof File)) return Response.json({ error: "Invalid picture" }, { status: 400 });
    if (file instanceof File && file.size) image = await uploadComplaintImage(file);
    const reference = await nextReference("ASSET", Number(lagosDate(now).slice(0, 4)));
    const client = await mongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const saved = await db.collection("assetComplaints").insertOne({ ...input, reference, submittedAt: now, handlingStatus: "Received", image: image || null }, { session });
        await db.collection("submissionKeys").insertOne({ key, peerHash, reference, createdAt: now, expiresAt: new Date(now.getTime() + 24 * 60 * 60_000) }, { session });
        await db.collection("notificationJobs").insertOne({ complaintId: saved.insertedId, reference, kind: input.submissionType === "Reminder" ? "reminder" : "new", status: "pending", attempts: 0, nextAttemptAt: now, createdAt: now }, { session });
      });
    } finally { await session.endSession(); }
    return Response.json({ reference }, { status: 201 });
  } catch (error) {
    if (image) { try { await deleteComplaintImage(image.publicId); } catch { /* retain for cleanup job */ } }
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid complaint fields", fields: error.flatten().fieldErrors }, { status: 400 });
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return Response.json({ error: "Submission already in progress. Retry shortly." }, { status: 409 });
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const staff = await currentStaff();
    if (!staff) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const url = new URL(request.url);
    const { parsed, query } = complaintFilters(url.searchParams);
    const collection = (await database()).collection("assetComplaints");
    const [rows, total] = await Promise.all([
      collection.find(query, { projection: { reference: 1, submittedAt: 1, complaintType: 1, buildingSection: 1, submissionType: 1, handlingStatus: 1, complainantName: 1 } }).sort({ submittedAt: -1, _id: -1 }).skip((parsed.page - 1) * 25).limit(25).toArray(),
      collection.countDocuments(query)
    ]);
    return Response.json({ rows, total, page: parsed.page, pageSize: 25 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid filters" }, { status: 400 });
    return errorResponse(error);
  }
}
