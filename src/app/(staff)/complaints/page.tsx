import Link from "next/link";
import { database } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { complaintFilters } from "@/modules/complaints/filters";
import { BUILDING_SECTIONS, COMPLAINT_TYPES, HANDLING_STATUSES } from "@/modules/complaints/validation";
export const runtime = "nodejs";

type Params = { [key: string]: string | string[] | undefined };
export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireStaff();
  const values = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (typeof value === "string") params.set(key, value);
  let filters;
  try { filters = complaintFilters(params); }
  catch { return <main><h1>Assets Complaints</h1><p role="alert">Invalid filters. Check dates and selections.</p><Link href="/complaints">Clear filters</Link></main>; }
  const { parsed, query } = filters;
  const collection = (await database()).collection("assetComplaints");
  const [rows, total] = await Promise.all([
    collection.find(query, { projection: { reference: 1, submittedAt: 1, complaintType: 1, buildingSection: 1, submissionType: 1, handlingStatus: 1, complainantName: 1 } }).sort({ submittedAt: -1, _id: -1 }).skip((parsed.page - 1) * 25).limit(25).toArray(),
    collection.countDocuments(query)
  ]);
  function pageLink(page: number) { const next = new URLSearchParams(params); next.set("page", String(page)); return `/complaints?${next}`; }
  return <main className="landscape-list"><p className="eyebrow">Assets</p><h1>Assets Complaints</h1><p>{total} matching complaint{total === 1 ? "" : "s"}</p><form method="get" className="filter-grid"><label>Search<input name="search" defaultValue={parsed.search} placeholder="Reference, name, description or office" /></label><label>From<input name="from" type="date" defaultValue={parsed.from} /></label><label>To<input name="to" type="date" defaultValue={parsed.to} /></label><label>Complaint type<select name="complaintType" defaultValue={parsed.complaintType || ""}><option value="">All types</option>{COMPLAINT_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label><label>Building section<select name="buildingSection" defaultValue={parsed.buildingSection || ""}><option value="">All sections</option>{BUILDING_SECTIONS.map((v) => <option key={v}>{v}</option>)}</select></label><label>Submission type<select name="submissionType" defaultValue={parsed.submissionType || ""}><option value="">All submissions</option><option>First complaint</option><option>Reminder</option></select></label><label>Handling status<select name="handlingStatus" defaultValue={parsed.handlingStatus || ""}><option value="">All statuses</option>{HANDLING_STATUSES.map((v) => <option key={v}>{v}</option>)}</select></label><div className="filter-actions"><button className="button">Apply filters</button><Link href="/complaints">Clear</Link></div></form><p><a className="button" href={`/api/complaints/report/pdf?${new URLSearchParams(Array.from(params.entries()).filter(([key]) => key !== "page"))}`}>Download filtered PDF</a></p><section><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Submitted (Lagos)</th><th>Type</th><th>Section</th><th>Submission</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row._id)}><td><Link href={`/complaints/${row.reference}`}>{row.reference}</Link></td><td>{new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(row.submittedAt)}</td><td>{row.complaintType}</td><td>{row.buildingSection}</td><td>{row.submissionType}</td><td>{row.handlingStatus}</td></tr>)}</tbody></table></div>{rows.length === 0 && <p>No complaints match these filters.</p>}</section><div className="pagination">{parsed.page > 1 && <Link href={pageLink(parsed.page - 1)}>Previous</Link>}<span>Page {parsed.page}</span>{parsed.page * 25 < total && <Link href={pageLink(parsed.page + 1)}>Next</Link>}</div></main>;
}
