import dns from "node:dns";
import { isIP } from "node:net";

export function configureMongoDns() {
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (!configured) return;
  const servers = configured.split(",").map((value) => value.trim());
  if (servers.length === 0 || servers.some((value) => !isIP(value))) {
    throw new Error("MONGODB_DNS_SERVERS must contain comma-separated IP addresses.");
  }
  dns.setServers(servers);
}
