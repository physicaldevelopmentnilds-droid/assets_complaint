import { readFile, writeFile } from "node:fs/promises";
import webpush from "web-push";

const path = ".env.local";
let file = await readFile(path, "utf8");
const read = (name) => file.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim() || "";
if (read("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || read("VAPID_PRIVATE_KEY")) throw new Error("Push keys already exist. Keep and reuse the existing pair.");
const { publicKey, privateKey } = webpush.generateVAPIDKeys();
const replace = (name, value) => {
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (!pattern.test(file)) throw new Error(`${name} is missing from .env.local`);
  file = file.replace(pattern, `${name}=${value}`);
};
replace("NEXT_PUBLIC_VAPID_PUBLIC_KEY", publicKey);
replace("VAPID_PRIVATE_KEY", privateKey);
await writeFile(path, file);
process.stdout.write("Web Push keys saved to ignored .env.local. Retain the key pair across deployments.\n");
