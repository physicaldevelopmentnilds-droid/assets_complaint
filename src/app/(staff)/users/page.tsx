import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import UserManagement from "./user-management";
export const runtime = "nodejs";
export default async function UsersPage() {
  await requireAdmin();
  const users = await (await database()).collection("users").find({ active: true }, { projection: { email: 1, name: 1, role: 1, cashbookAccess: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(200).toArray();
  return <main><p className="eyebrow">Staff access</p><h1>User management</h1><UserManagement initialUsers={users.map((user) => ({ id: String(user._id), email: String(user.email), name: String(user.name), role: String(user.role), cashbookAccess: user.cashbookAccess === true }))} /></main>;
}
