import Link from "next/link";
import { canAccessCashbook } from "@/lib/permissions";
import { requireStaff } from "@/lib/auth";
export const runtime = "nodejs";
export default async function ReportsPage() {
  const staff = await requireStaff();
  return <main><p className="eyebrow">Exports</p><h1>Reports</h1><p>Apply filters in each module before downloading a PDF. Reports include every matching record, beyond the current table page.</p><div className="metric-grid"><section><h2>Assets Complaints</h2><p>Filter by submission date, type, section, submission type and handling status.</p><Link href="/complaints">Open complaint reports</Link></section><section><h2>Memo Tracking</h2><p>Filter by processing state, progress and registry date.</p><Link href="/memos">Open memo reports</Link></section>{canAccessCashbook(staff) && <section><h2>Cashbook</h2><p>Filter by period, type and search while retaining true ledger balances.</p><Link href="/cashbook">Open cashbook reports</Link></section>}</div></main>;
}
