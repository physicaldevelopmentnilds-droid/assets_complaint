import { MongoClient, type Db } from "mongodb";
import dns from "node:dns";
import { isIP } from "node:net";
import { serverEnv } from "./env";

const globalMongo = globalThis as typeof globalThis & { __nildsMongo?: Promise<MongoClient> };

export async function database(): Promise<Db> {
  const { MONGODB_URI, MONGODB_DATABASE, MONGODB_DNS_SERVERS } = serverEnv();
  if (MONGODB_DNS_SERVERS) {
    const servers = MONGODB_DNS_SERVERS.split(",").map((value) => value.trim());
    if (servers.some((value) => !isIP(value))) throw new Error("MONGODB_DNS_SERVERS must contain comma-separated IP addresses.");
    dns.setServers(servers);
  }
  globalMongo.__nildsMongo ??= new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 12000 })
    .connect()
    .catch((error) => {
      globalMongo.__nildsMongo = undefined;
      throw error;
    });
  return (await globalMongo.__nildsMongo).db(MONGODB_DATABASE);
}

export async function mongoClient(): Promise<MongoClient> {
  await database();
  return globalMongo.__nildsMongo!;
}
