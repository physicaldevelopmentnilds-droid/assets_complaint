import { MongoClient } from "mongodb";
import nextEnv from "@next/env";
import { configureMongoDns } from "./mongo-dns.mjs";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DATABASE || "nilds_physical_development");
  const users = await db.collection("users").find(
    { normalizedEmail: "umarfrq65@gmail.com" },
    { projection: { _id: 1, role: 1, active: 1, passwordHash: 1 } }
  ).toArray();
  if (users.length !== 1 || users[0].role !== "admin" || users[0].active !== true || typeof users[0].passwordHash !== "string") {
    throw new Error("Initial administrator record is incomplete or duplicated.");
  }
  const audited = await db.collection("auditLogs").countDocuments({ action: "user.bootstrapped", targetId: users[0]._id });
  if (audited !== 1) throw new Error("Bootstrap audit record is missing or duplicated.");
  process.stdout.write("Initial administrator record and bootstrap audit verified.\n");
} finally { await client.close(); }
