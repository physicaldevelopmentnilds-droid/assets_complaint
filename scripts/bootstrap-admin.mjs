import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { stdout } from "node:process";
import nextEnv from "@next/env";
import { configureMongoDns } from "./mongo-dns.mjs";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || "nilds_physical_development";
const email = "umarfrq65@gmail.com";
if (!uri) throw new Error("MONGODB_URI is required.");
let password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(databaseName);
  const users = db.collection("users");
  await users.createIndex({ normalizedEmail: 1 }, { unique: true });
  const existing = await users.findOne({ normalizedEmail: email });
  if (existing) { stdout.write("Administrator account already exists; no changes made.\n"); process.exitCode = 0; }
  else {
    if (!password || password.length < 12) throw new Error("Supply BOOTSTRAP_ADMIN_PASSWORD privately with at least 12 characters.");
    const hash = await bcrypt.hash(password, 12);
    const now = new Date();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await users.insertOne({ email, normalizedEmail: email, name: "Initial administrator", role: "admin", active: true, passwordHash: hash, createdAt: now, updatedAt: now }, { session });
        await db.collection("auditLogs").insertOne({ action: "user.bootstrapped", targetId: result.insertedId, at: now }, { session });
      });
    } finally { await session.endSession(); }
    stdout.write("Initial administrator created.\n");
  }
} finally { password = undefined; await client.close(); }
