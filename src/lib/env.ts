import { z } from "zod";

const serverSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DATABASE: z.string().min(1).default("nilds_physical_development"),
  MONGODB_DNS_SERVERS: z.string().optional(),
  APP_URL: z.url(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional()
});

export function serverEnv() {
  return serverSchema.parse(process.env);
}
