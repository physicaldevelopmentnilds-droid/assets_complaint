import nextEnv from "@next/env";
import { v2 as cloudinary } from "cloudinary";

nextEnv.loadEnvConfig(process.cwd());
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error("Cloudinary configuration is incomplete.");
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
const response = await cloudinary.api.ping();
if (response.status !== "ok") throw new Error("Cloudinary ping did not return ok.");
process.stdout.write("Cloudinary authenticated API ping succeeded.\n");
