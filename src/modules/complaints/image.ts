import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { serverEnv } from "@/lib/env";

export type ComplaintImage = { publicId: string; assetUrl: string; originalFilename: string; format: string; bytes: number; width: number; height: number };
const MAX_BYTES = 5 * 1024 * 1024;

export function complaintImageFormat(format: string): "jpeg" | "png" | "webp" {
  if (format === "jpg" || format === "jpeg") return "jpeg";
  if (format === "png" || format === "webp") return format;
  throw new Error("Invalid stored image format.");
}

export async function uploadComplaintImage(file: File): Promise<ComplaintImage> {
  if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Image must be no larger than 5 MiB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPEG, PNG or WebP image.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const info = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata();
  if (!info.width || !info.height || info.width * info.height > 25_000_000 || !["jpeg", "png", "webp"].includes(info.format || "")) throw new Error("Invalid or oversized image.");
  const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[file.type];
  if (info.format !== expected) throw new Error("Image content does not match its declared type.");
  const env = serverEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("Image storage is unavailable.");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  const publicId = `nilds/complaints/${randomUUID()}`;
  const result = await new Promise<{ secure_url: string; public_id: string; format: string; width: number; height: number; bytes: number }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: "image", type: "authenticated", overwrite: false }, (error, result) => error || !result ? reject(error || new Error("Upload failed")) : resolve(result));
    upload.end(bytes);
  });
  return { publicId: result.public_id, assetUrl: result.secure_url, originalFilename: file.name.slice(0, 200), format: complaintImageFormat(result.format), bytes: result.bytes, width: result.width, height: result.height };
}

export async function deleteComplaintImage(publicId: string) {
  const env = serverEnv();
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  await cloudinary.uploader.destroy(publicId, { resource_type: "image", type: "authenticated" });
}

export async function fetchComplaintImage(image: ComplaintImage): Promise<Buffer> {
  if (!/^nilds\/complaints\/[0-9a-f-]{36}$/.test(image.publicId)) throw new Error("Invalid stored image identifier.");
  const format = complaintImageFormat(image.format);
  const env = serverEnv();
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  const signed = cloudinary.utils.private_download_url(image.publicId, format === "jpeg" ? "jpg" : format, { resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60 });
  const url = new URL(signed);
  if (url.protocol !== "https:" || url.hostname !== "api.cloudinary.com" || !url.pathname.startsWith(`/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/download`)) throw new Error("Invalid image delivery destination.");
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length") || 0) > 6 * 1024 * 1024) throw new Error("Attached image is unavailable.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Attached image is unavailable.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 6 * 1024 * 1024) { await reader.cancel(); throw new Error("Attached image exceeds delivery limit."); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
