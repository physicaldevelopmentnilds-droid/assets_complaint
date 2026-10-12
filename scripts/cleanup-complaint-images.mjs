import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import { configureMongoDns } from "./mongo-dns.mjs";

nextEnv.loadEnvConfig(process.cwd());
configureMongoDns();
const { MONGODB_URI, MONGODB_DATABASE = "nilds_physical_development", CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!MONGODB_URI || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error("Database and Cloudinary configuration are required.");
const destructive = process.argv.includes("--delete");
const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
let candidates = 0;
let removed = 0;
try {
  await client.connect();
  const db = client.db(MONGODB_DATABASE);
  await db.command({ ping: 1 });
  const cutoff = Date.now() - 24 * 60 * 60_000;
  let cursor;
  do {
    const page = await cloudinary.api.resources({ resource_type: "image", type: "authenticated", prefix: "nilds/complaints/", max_results: 500, ...(cursor ? { next_cursor: cursor } : {}) });
    for (const asset of page.resources || []) {
      if (!/^nilds\/complaints\/[0-9a-f-]{36}$/.test(asset.public_id)) continue;
      if (!asset.created_at || Date.parse(asset.created_at) >= cutoff) continue;
      const linked = await db.collection("assetComplaints").findOne({ "image.publicId": asset.public_id }, { projection: { _id: 1 } });
      if (linked) continue;
      candidates++;
      if (destructive) {
        const result = await cloudinary.uploader.destroy(asset.public_id, { resource_type: "image", type: "authenticated" });
        if (result.result === "ok") removed++;
      }
    }
    cursor = page.next_cursor;
  } while (cursor);
  process.stdout.write(`Older unreferenced complaint image candidates: ${candidates}; removed: ${removed}. ${destructive ? "Delete mode." : "Dry run."}\n`);
} finally { await client.close(); }
