import nextEnv from "@next/env";
import { MongoClient, ObjectId } from "mongodb";
import webpush from "web-push";
import { configureMongoDns } from "./mongo-dns.mjs";
import { classifyPushFailure, privatePushPayload, retryDelayMs } from "../src/modules/push/delivery.ts";
import { validatePushEndpoint } from "../src/modules/push/validation.ts";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
const { MONGODB_URI, MONGODB_DATABASE = "nilds_physical_development", NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
if (!MONGODB_URI || !NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) throw new Error("Worker configuration is incomplete.");
webpush.setVapidDetails(VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(MONGODB_DATABASE);
const once = process.argv.includes("--once");
let stopped = false;
process.on("SIGINT", () => { stopped = true; });
process.on("SIGTERM", () => { stopped = true; });

async function processOne() {
  const now = new Date();
  const job = await db.collection("notificationJobs").findOneAndUpdate({ $or: [{ status: { $in: ["pending", "retry"] }, nextAttemptAt: { $lte: now } }, { status: "processing", lockedUntil: { $lt: now } }] }, { $set: { status: "processing", lockedUntil: new Date(now.getTime() + 60_000), updatedAt: now }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: "after" });
  if (!job) return false;
  let temporaryFailure = false;
  try {
    const payload = privatePushPayload(job.kind, job.reference);
    const subscriptions = await db.collection("pushSubscriptions").find({ active: true }).toArray();
    for (const subscription of subscriptions) {
      const user = ObjectId.isValid(subscription.ownerId) ? await db.collection("users").findOne({ _id: new ObjectId(subscription.ownerId), active: true, role: { $in: ["admin", "officer"] } }, { projection: { _id: 1 } }) : null;
      if (!user) { await db.collection("pushSubscriptions").deleteOne({ _id: subscription._id }); continue; }
      const deliveries = db.collection("notificationDeliveries");
      const prior = await deliveries.findOne({ jobId: job._id, subscriptionId: subscription._id });
      if (["sent", "expired", "permanent"].includes(prior?.status)) continue;
      try {
        validatePushEndpoint(subscription.endpoint);
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, payload, { TTL: 3600, timeout: 10000 });
        await deliveries.updateOne({ jobId: job._id, subscriptionId: subscription._id }, { $set: { status: "sent", updatedAt: new Date() }, $inc: { attempts: 1 }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      } catch (error) {
        const status = error instanceof Error && error.message === "Unsupported push endpoint." ? "permanent" : classifyPushFailure(typeof error?.statusCode === "number" ? error.statusCode : undefined);
        await deliveries.updateOne({ jobId: job._id, subscriptionId: subscription._id }, { $set: { status, updatedAt: new Date() }, $inc: { attempts: 1 }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
        if (status === "expired") await db.collection("pushSubscriptions").deleteOne({ _id: subscription._id });
        if (status === "temporary") temporaryFailure = true;
      }
    }
    const attempts = Number(job.attempts || 1);
    const retry = temporaryFailure && attempts < 6;
    await db.collection("notificationJobs").updateOne({ _id: job._id }, { $set: { status: retry ? "retry" : temporaryFailure ? "dead" : "done", nextAttemptAt: retry ? new Date(Date.now() + retryDelayMs(attempts)) : null, lockedUntil: null, updatedAt: new Date() } });
  } catch {
    const attempts = Number(job.attempts || 1);
    await db.collection("notificationJobs").updateOne({ _id: job._id }, { $set: { status: attempts < 6 ? "retry" : "dead", nextAttemptAt: attempts < 6 ? new Date(Date.now() + retryDelayMs(attempts)) : null, lockedUntil: null, updatedAt: new Date() } });
  }
  return true;
}

try {
  do {
    let processed = 0;
    while (!stopped && processed < 100 && await processOne()) processed++;
    if (processed) process.stdout.write(`Processed ${processed} notification job(s).\n`);
    if (once || stopped) break;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (!stopped);
} finally { await client.close(); }
