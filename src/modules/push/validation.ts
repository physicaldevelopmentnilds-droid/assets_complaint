import { createHash } from "node:crypto";
import { z } from "zod";

export const subscriptionSchema = z.object({
  endpoint: z.url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(60).max(200), auth: z.string().min(10).max(100) }).strict()
}).strict();

export function validatePushEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  const host = url.hostname.toLowerCase();
  const allowed = host === "fcm.googleapis.com" || host === "fcm-xm.googleapis.com" || host === "updates.push.services.mozilla.com" || host === "push.services.mozilla.com" || host.endsWith(".push.apple.com");
  if (!allowed || url.protocol !== "https:" || url.port || url.username || url.password || url.hash) throw new Error("Unsupported push endpoint.");
  return createHash("sha256").update(endpoint).digest("hex");
}
