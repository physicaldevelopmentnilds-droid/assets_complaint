import Link from "next/link";
import { requireCashbook } from "@/lib/auth";
import { database } from "@/lib/db";
import { lagosDate } from "@/lib/dates";
import { formatKobo, CASHBOOK_START_DATE, OPENING_BALANCE_KOBO } from "@/lib/money";
import { cashbookFilters } from "@/modules/cashbook/filters";
import { calculateLedger, type CashbookEntry } from "@/modules/cashbook/ledger";
import TransactionForm from "./transaction-form";
import VoidButton from "./void-button";
export const runtime = "nodejs";
type Params = Record<string, string | string[] | undefined>;
export default async function CashbookPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireCashbook();
  const values = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (typeof value === "string") params.set(key, value);
  let filters;
  try { filters = cashbookFilters(params); }
  catch { return <main><h1>Cashbook</h1><p role="alert">Invalid filters.</p><Link href="/cashbook">Clear filters</Link></main>; }
  const entries = await (await database()).collection("cashbookTransactions").find(filters.to ? { transactionDate: { $lte: filters.to } } : {}).sort({ transactionDate: 1, sequence: 1 }).toArray();
  const ledger = calculateLedger(entries as unknown as CashbookEntry[], filters);
  const today = lagosDate(new Date());
  const todayLedger = calculateLedger(entries as unknown as CashbookEntry[], { to: today });
  const rows = ledger.rows.slice((filters.page - 1) * 25, filters.page * 25);
  function pageLink(page: number) { const next = new URLSearchParams(params); next.set("page", String(page)); return `/cashbook?${next}`; }
  return <main className="landscape-list"><p className="eyebrow">Finance</p><h1>Cashbook</h1><p>Opening balance {formatKobo(OPENING_BALANCE_KOBO)} effective {CASHBOOK_START_DATE}. Transactions before this date are blocked.</p><div className="metric-grid"><section><h2>As of {today}</h2><strong>{formatKobo(todayLedger.closingBalanceKobo)}</strong><p>Future entries excluded.</p></section><section><h2>{filters.from || filters.to ? "Selected period" : "All entered dates"}</h2><strong>{formatKobo(ledger.closingBalanceKobo)}</strong><p>{filters.from || filters.to ? `${filters.from || CASHBOOK_START_DATE} to ${filters.to || "latest entered date"}` : "Includes future entries if present."}</p></section></div><section><h2>Add transaction</h2><TransactionForm /></section><form method="get" className="filter-grid"><label>From<input name="from" type="date" defaultValue={filters.from} /></label><label>To<input name="to" type="date" defaultValue={filters.to} /></label><label>Type<select name="type" defaultValue={filters.type || ""}><option value="">All</option><option value="Income">Income</option><option value="Expenditure">Expenses</option></select></label><label>Search<input name="search" defaultValue={filters.search} placeholder="Description or reference" /></label><div className="filter-actions"><button className="button">Apply filters</button><Link href="/cashbook">Clear</Link></div></form><div className="metric-grid"><section><h2>Period ledger totals</h2><p>Opening: {formatKobo(ledger.openingBalanceKobo)}</p><p>Income: {formatKobo(ledger.periodIncomeKobo)}</p><p>Expenditure: {formatKobo(ledger.periodExpenditureKobo)}</p><strong>Closing: {formatKobo(ledger.closingBalanceKobo)}</strong></section><section><h2>Visible filter subtotals</h2><p>Income: {formatKobo(ledger.filteredIncomeKobo)}</p><p>Expenditure: {formatKobo(ledger.filteredExpenditureKobo)}</p><p>Running balances include hidden entries.</p></section></div><p><a className="button" href={`/api/cashbook/report/pdf?${new URLSearchParams(Array.from(params.entries()).filter(([key]) => key !== "page"))}`}>Download filtered PDF</a></p><section><div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Receipt/voucher</th><th>Income</th><th>Expenditure</th><th>Running balance</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.reference}><td>{row.transactionDate}</td><td>{row.description}</td><td>{row.reference}</td><td>{row.receiptReference || "—"}</td><td>{row.type === "Income" ? formatKobo(row.amountKobo) : "—"}</td><td>{row.type === "Expenditure" ? formatKobo(row.amountKobo) : "—"}</td><td>{formatKobo(row.runningBalanceKobo)}</td><td>{row.voidedAt ? `Voided: ${row.voidReason}` : "Valid"}</td><td>{!row.voidedAt && <VoidButton reference={row.reference} />}</td></tr>)}</tbody></table></div>{!rows.length && <p>No transactions match these filters.</p>}</section><div className="pagination">{filters.page > 1 && <Link href={pageLink(filters.page - 1)}>Previous</Link>}<span>Page {filters.page}</span>{filters.page * 25 < ledger.rows.length && <Link href={pageLink(filters.page + 1)}>Next</Link>}</div></main>;
}
