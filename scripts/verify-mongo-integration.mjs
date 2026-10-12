import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import nextEnv from "@next/env";
import { configureMongoDns } from "./mongo-dns.mjs";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");

const databaseName = `nilds_integration_${randomBytes(8).toString("hex")}`;
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
let created = false;
try {
  await client.connect();
  const db = client.db(databaseName);
  await db.collection("assetComplaints").createIndex({ reference: 1 }, { unique: true });
  await db.collection("numberSequences").createIndex({ name: 1 }, { unique: true });
  created = true;
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const sequence = await db.collection("numberSequences").findOneAndUpdate(
        { name: "ASSET-2026" }, { $inc: { value: 1 } },
        { upsert: true, returnDocument: "after", session }
      );
      if (sequence?.value !== 1) throw new Error("Atomic sequence failed.");
      await db.collection("assetComplaints").insertOne({ reference: "ASSET-2026-000001", synthetic: true }, { session });
      await db.collection("notificationJobs").insertOne({ reference: "ASSET-2026-000001", status: "pending", synthetic: true }, { session });
    });
  } finally { await session.endSession(); }
  const complaintCount = await db.collection("assetComplaints").countDocuments({ synthetic: true });
  const jobCount = await db.collection("notificationJobs").countDocuments({ synthetic: true });
  if (complaintCount !== 1 || jobCount !== 1) throw new Error("Transaction did not persist both records.");
  let duplicateRejected = false;
  try {
    await db.collection("assetComplaints").insertOne({ reference: "ASSET-2026-000001", synthetic: true });
  } catch (error) { duplicateRejected = error?.code === 11000; }
  if (!duplicateRejected) throw new Error("Unique reference index did not reject a duplicate.");
  process.stdout.write("MongoDB isolated transaction, persistence and unique index checks passed.\n");
} finally {
  if (created && databaseName.startsWith("nilds_integration_")) await client.db(databaseName).dropDatabase();
  await client.close();
}
