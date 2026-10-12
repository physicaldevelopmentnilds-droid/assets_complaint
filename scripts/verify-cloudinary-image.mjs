import nextEnv from "@next/env";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

nextEnv.loadEnvConfig(process.cwd());
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error("Cloudinary configuration is incomplete.");
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#0b4d42" } }).png().toBuffer();
const publicId = `nilds/integration-checks/${randomUUID()}`;
let uploaded = false;
try {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: "image", type: "authenticated", overwrite: false }, (error, response) => error || !response ? reject(error || new Error("Upload failed")) : resolve(response));
    stream.end(buffer);
  });
  uploaded = true;
  if (result.public_id !== publicId || result.width !== 2 || result.height !== 2 || result.format !== "png") throw new Error("Uploaded image metadata did not match.");
  process.stdout.write("Authenticated synthetic image upload succeeded.\n");
  const signed = cloudinary.utils.private_download_url(publicId, "png", { resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60 });
  const delivery = await fetch(signed, { signal: AbortSignal.timeout(10000) });
  const delivered = Buffer.from(await delivery.arrayBuffer());
  if (!delivery.ok || !delivered.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Signed authenticated image delivery failed.");
  process.stdout.write("Signed authenticated image delivery succeeded.\n");
} finally {
  if (uploaded) {
    const removed = await cloudinary.uploader.destroy(publicId, { resource_type: "image", type: "authenticated" });
    if (removed.result !== "ok") throw new Error("Synthetic image cleanup failed.");
    process.stdout.write("Synthetic image cleanup succeeded.\n");
  }
}
