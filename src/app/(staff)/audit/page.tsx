import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
export const runtime = "nodejs";
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const value = Number((await searchParams).page || "1");
  const page = Number.isInteger(value) ? Math.max(1, Math.min(10000, value)) : 1;
  const collection = (await database()).collection("auditLogs");
  const [rows, total] = await Promise.all([collection.find({}).sort({ at: -1, _id: -1 }).skip((page - 1) * 25).limit(25).toArray(), collection.countDocuments({})]);
  return <main><p className="eyebrow">Accountability</p><h1>Audit history</h1><p>{total} recorded action{total === 1 ? "" : "s"}. Sensitive credentials and tokens are excluded from audit details.</p><section><div className="table-wrap"><table><thead><tr><th>When (Lagos)</th><th>Action</th><th>Actor ID</th><th>Target ID</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row._id)}><td>{new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(row.at)}</td><td>{row.action}</td><td>{row.actorId || "System"}</td><td>{String(row.targetId || "—")}</td><td><pre>{JSON.stringify(row.details || {})}</pre></td></tr>)}</tbody></table></div>{!rows.length && <p>No audit actions yet.</p>}</section><div className="pagination">{page > 1 && <Link href={`/audit?page=${page - 1}`}>Previous</Link>}<span>Page {page}</span>{page * 25 < total && <Link href={`/audit?page=${page + 1}`}>Next</Link>}</div></main>;
}
