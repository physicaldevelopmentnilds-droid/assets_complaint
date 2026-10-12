import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { canAccessCashbook } from "@/lib/permissions";
import { database } from "@/lib/db";
import { lagosDate } from "@/lib/dates";
import { formatKobo } from "@/lib/money";
import { calculateLedger, type CashbookEntry } from "@/modules/cashbook/ledger";
export const runtime = "nodejs";
export default async function Dashboard() {
  const staff = await requireStaff();
  const db = await database();
  const today = lagosDate(new Date());
  const [received, inProgress, resolved, registry, unexecuted, entries] = await Promise.all([
    db.collection("assetComplaints").countDocuments({ handlingStatus: "Received" }),
    db.collection("assetComplaints").countDocuments({ handlingStatus: "In progress" }),
    db.collection("assetComplaints").countDocuments({ handlingStatus: "Resolved" }),
    db.collection("memos").countDocuments({ submittedToRegistry: true }),
    db.collection("memos").countDocuments({ projectExecuted: false }),
    canAccessCashbook(staff) ? db.collection("cashbookTransactions").find({ transactionDate: { $lte: today } }).sort({ transactionDate: 1, sequence: 1 }).toArray() : Promise.resolve([])
  ]);
  const ledger = calculateLedger(entries as unknown as CashbookEntry[], { to: today });
  return <main>
    <div className="dashboard-intro"><div><p className="eyebrow">Division overview</p><h1>Dashboard</h1><p>Welcome, {staff.name}. An overview of the records across the Physical Development Division.</p></div><span className="as-of-tag">As of {today} · Africa/Lagos</span></div>
    <div className="metric-grid dashboard-metrics">
      <section><p className="metric-kicker">01 / Facilities</p><h2>Assets Complaints</h2><div className="stat-list"><div><strong>{received}</strong><span>Received</span></div><div><strong>{inProgress}</strong><span>In progress</span></div><div><strong>{resolved}</strong><span>Resolved</span></div></div><Link href="/complaints">View complaints <span aria-hidden="true">→</span></Link></section>
      <section><p className="metric-kicker">02 / Projects</p><h2>Memo Tracking</h2><div className="stat-list"><div><strong>{registry}</strong><span>At registry</span></div><div><strong>{unexecuted}</strong><span>Not executed</span></div></div><Link href="/memos">View memos <span aria-hidden="true">→</span></Link></section>
      {canAccessCashbook(staff) && <section><p className="metric-kicker">03 / Finance</p><h2>Cashbook balance</h2><strong className="balance-value">{formatKobo(ledger.closingBalanceKobo)}</strong><p>Income {formatKobo(ledger.periodIncomeKobo)} · Expenditure {formatKobo(ledger.periodExpenditureKobo)}</p><p>Figures include entries through {today}; future entries are excluded.</p><Link href="/cashbook">Open cashbook <span aria-hidden="true">→</span></Link></section>}
    </div>
    <section className="dashboard-note"><h2>Reporting and records</h2><p>Complaint and memo counts cover all saved records. Use each module’s filters for a detailed view, or open Reports to export PDFs.</p><Link className="button secondary" href="/reports">Go to reports</Link></section>
  </main>;
}
