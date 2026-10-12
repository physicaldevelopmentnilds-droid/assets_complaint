import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { configureMongoDns } from "./mongo-dns.mjs";
nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing.");
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
try {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  const hello = await client.db("admin").command({ hello: 1 });
  if (!hello.setName) throw new Error("MongoDB is reachable but is not a replica set.");
  process.stdout.write("MongoDB authenticated ping succeeded; replica set confirmed.\n");
} catch (error) {
  const name = error instanceof Error ? error.name : "UnknownError";
  process.stderr.write(`MongoDB verification failed (${name}). Check cluster host, database user and Atlas network access.\n`);
  if (error && typeof error === "object" && "reason" in error && error.reason?.servers instanceof Map) {
    for (const [host, server] of error.reason.servers) {
      const cause = server.error;
      const underlying = cause?.cause;
      process.stderr.write(`${host}: ${cause?.name || "NoServerResponse"}${cause?.code ? ` (${cause.code})` : ""}${underlying?.code ? `, underlying ${underlying.code}` : ""}\n`);
    }
  }
  process.exitCode = 1;
} finally { await client.close(); }
