import dns from "node:dns";
import { readFile, writeFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import nextEnv from "@next/env";
import { configureMongoDns } from "./mongo-dns.mjs";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
const sourceValue = process.env.MONGODB_URI;
if (sourceValue?.startsWith("mongodb://")) {
  process.stdout.write("MongoDB URI is already in standard format; no changes made.\n");
  process.exit(0);
}
if (!sourceValue?.startsWith("mongodb+srv://")) throw new Error("Private Atlas SRV URI is required.");
const source = new URL(sourceValue);
const records = await dns.promises.resolveSrv(`_mongodb._tcp.${source.hostname}`);
const hosts = records.map((record) => `${record.name}:${record.port}`).join(",");
const params = new URLSearchParams(source.search);
params.set("tls", "true");
params.set("authSource", "admin");
const base = `mongodb://${source.username}:${source.password}@${hosts}/`;
const candidate = `${base}?${params.toString()}`;
const client = new MongoClient(candidate, { serverSelectionTimeoutMS: 12000 });
let replicaSet;
try {
  await client.connect();
  const hello = await client.db("admin").command({ hello: 1 });
  replicaSet = hello.setName;
  if (!replicaSet) throw new Error("Replica set was not discovered.");
} finally { await client.close(); }
params.set("replicaSet", replicaSet);
const finalUri = `${base}?${params.toString()}`;
const envPath = ".env.local";
const contents = await readFile(envPath, "utf8");
const lines = contents.split(/\r?\n/);
const matches = lines.flatMap((line, index) => line.startsWith("MONGODB_URI=") ? [index] : []);
if (matches.length !== 1) throw new Error("Expected exactly one MONGODB_URI entry in .env.local.");
lines[matches[0]] = `MONGODB_URI=${finalUri}`;
await writeFile(envPath, lines.join("\n"));
process.stdout.write("Private MongoDB URI converted to verified standard replica-set format. Restart the app.\n");
