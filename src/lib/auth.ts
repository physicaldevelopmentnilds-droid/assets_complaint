import { randomBytes, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { database } from "./db";
import { assertCashbookAccess } from "./permissions";

export type Role = "admin" | "officer";
export type Staff = { id: string; email: string; name: string; role: Role; cashbookAccess: boolean };
const COOKIE = "nilds_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function currentSessionHash(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? digest(token) : null;
}

export async function currentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = await database();
  const session = await db.collection("sessions").findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db.collection("users").findOne({ _id: session.userId, active: true });
  if (!user || (user.role !== "admin" && user.role !== "officer")) return null;
  return { id: String(user._id), email: String(user.email), name: String(user.name), role: user.role, cashbookAccess: user.cashbookAccess === true };
}

export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) throw new Error("UNAUTHORIZED");
  return staff;
}

export async function requireCashbook() {
  const staff = await requireStaff();
  assertCashbookAccess(staff);
  return staff;
}

export async function requireAdmin(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") throw new Error("FORBIDDEN");
  return staff;
}

export async function issueSession(userId: unknown) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await (await database()).collection("sessions").insertOne({ userId, tokenHash: digest(token), createdAt: new Date(), expiresAt });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function invalidateSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await database();
    const tokenHash = digest(token);
    await db.collection("pushSubscriptions").deleteMany({ sessionTokenHash: tokenHash });
    await db.collection("sessions").deleteOne({ tokenHash });
  }
  jar.delete(COOKIE);
}

export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  const configured = process.env.APP_URL;
  if (!origin || !host || !configured || new URL(origin).origin !== new URL(configured).origin || new URL(origin).host !== host) throw new Error("INVALID_ORIGIN");
}

export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const name = error instanceof Error ? error.name : "UnknownError";
  const networkFailure = name === "MongoNetworkError" || name === "MongoServerSelectionError" || name === "PoolClearedOnNetworkError";
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" || message === "INVALID_ORIGIN" ? 403 : networkFailure ? 503 : 500;
  if (status >= 500) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "none";
    const syscall = typeof error === "object" && error && "syscall" in error ? String(error.syscall) : "none";
    console.error(`Request failed: ${name}, code ${code}, syscall ${syscall}`);
  }
  return Response.json({ error: status === 503 ? "Database temporarily unavailable" : status === 500 ? "Server error" : message }, { status });
}
