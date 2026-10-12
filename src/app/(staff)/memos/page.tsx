import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { memoFilters } from "@/modules/memos/filters";
export const runtime = "nodejs";
type Params = Record<string, string | string[] | undefined>;
export default async function MemosPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireStaff();
  const values = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (typeof value === "string") params.set(key, value);
  let filters;
  try { filters = memoFilters(params); }
  catch { return <main><h1>Memo Tracking</h1><p role="alert">Invalid filters.</p><Link href="/memos">Clear filters</Link></main>; }
  const { parsed, query } = filters;
  const collection = (await database()).collection("memos");
  const [rows, total] = await Promise.all([collection.find(query).sort({ createdAt: -1, _id: -1 }).skip((parsed.page - 1) * 25).limit(25).toArray(), collection.countDocuments(query)]);
  function pageLink(page: number) { const next = new URLSearchParams(params); next.set("page", String(page)); return `/memos?${next}`; }
  const boolSelect = (name: string, label: string, value?: string) => <label key={name}>{label}<select name={name} defaultValue={value || ""}><option value="">All</option><option value="true">Yes</option><option value="false">No</option></select></label>;
  return <main className="landscape-list"><p className="eyebrow">Projects and registry</p><h1>Memo Tracking</h1><p>{total} matching memo{total === 1 ? "" : "s"}</p><p><Link className="button" href="/memos/new">Create memo</Link></p><form method="get" className="filter-grid"><label>Search<input name="search" defaultValue={parsed.search} placeholder="Subject, drafter, recipient, reference" /></label>{boolSelect("reviewed", "Reviewed", parsed.reviewed)}{boolSelect("approved", "Approved", parsed.approved)}{boolSelect("submittedToRegistry", "Submitted to registry", parsed.submittedToRegistry)}{boolSelect("projectExecuted", "Project executed", parsed.projectExecuted)}<label>Progress from<input name="progressMin" type="number" min={0} max={100} defaultValue={parsed.progressMin} /></label><label>Progress to<input name="progressMax" type="number" min={0} max={100} defaultValue={parsed.progressMax} /></label><label>Registry date from<input name="registryFrom" type="date" defaultValue={parsed.registryFrom} /></label><label>Registry date to<input name="registryTo" type="date" defaultValue={parsed.registryTo} /></label><div className="filter-actions"><button className="button">Apply filters</button><Link href="/memos">Clear</Link></div></form><p><a className="button" href={`/api/memos/report/pdf?${new URLSearchParams(Array.from(params.entries()).filter(([key]) => key !== "page"))}`}>Download filtered PDF</a></p><section><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Subject</th><th>Drafted by</th><th>Recipient</th><th>Registry</th><th>Progress</th><th>Executed</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row._id)}><td><Link href={`/memos/${row.reference}`}>{row.reference}</Link></td><td>{row.subject}</td><td>{row.draftedBy}</td><td>{row.recipient}</td><td>{row.registryDate || "—"}</td><td>{row.projectProgress}%</td><td>{row.projectExecuted ? "Yes" : "No"}</td></tr>)}</tbody></table></div>{!rows.length && <p>No memos match these filters.</p>}</section><div className="pagination">{parsed.page > 1 && <Link href={pageLink(parsed.page - 1)}>Previous</Link>}<span>Page {parsed.page}</span>{parsed.page * 25 < total && <Link href={pageLink(parsed.page + 1)}>Next</Link>}</div></main>;
}
