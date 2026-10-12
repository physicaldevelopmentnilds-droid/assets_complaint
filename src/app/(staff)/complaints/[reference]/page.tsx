import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import Brand from "../../../brand";
import StatusForm from "./status-form";
import PrintButton from "./print-button";
export const runtime = "nodejs";

export default async function ComplaintDetail({ params }: { params: Promise<{ reference: string }> }) {
  await requireStaff();
  const { reference } = await params;
  const row = await (await database()).collection("assetComplaints").findOne({ reference });
  if (!row) notFound();
  const type = row.complaintType === "Other" ? `${row.complaintType}: ${row.complaintTypeOther}` : row.complaintType;
  const building = row.buildingSection === "Other" ? `${row.buildingSection}: ${row.buildingSectionOther}` : row.buildingSection;
  const details = (items: [string, string][]) => <dl className="complaint-fields">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl>;
  return <main className="complaint-detail">
    <div className="screen-only complaint-toolbar"><Link href="/complaints">Back to complaints</Link><div className="action-row"><PrintButton reference={row.reference} /><a className="button" href={`/api/complaints/${row.reference}/pdf`}>Download PDF</a></div></div>
    <article className="complaint-sheet">
      <header className="complaint-sheet-header"><Brand /><div><span className="national-assembly">National Assembly</span><p>Official complaint record</p></div></header>
      <div className="complaint-sheet-title"><div><p className="eyebrow">Assets complaint</p><h1>{row.reference}</h1><p>Submitted {new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(row.submittedAt)} (Lagos)</p></div><span className={`complaint-status ${row.handlingStatus === "Resolved" ? "resolved" : ""}`}>{row.handlingStatus}</span></div>
      <section className="complaint-block"><h2><span>01</span> Submission and location</h2>{details([["Complaint type", type], ["Building section", building], ["Floor", row.floor], ["Office number", row.officeNumber], ["Submission type", row.submissionType], ["Previous reference", row.previousReference]])}</section>
      <section className="complaint-block"><h2><span>02</span> Description of issue</h2><div className={`complaint-description-area ${row.image ? "with-picture" : ""}`}><p className="complaint-description">{row.description}</p>{row.image && <figure><Image unoptimized loading="eager" className="complaint-image" src={`/api/complaints/${row.reference}/image`} width={row.image.width} height={row.image.height} alt={`Picture attached to complaint ${row.reference}`} /><figcaption>Attached picture</figcaption></figure>}</div></section>
      <section className="complaint-block"><h2><span>03</span> Complainant details</h2>{details([["Name", row.complainantName], ["Department", row.department], ["Designation", row.designation], ["Contact number", row.contactNumber]])}</section>
      <footer className="complaint-sheet-footer">Physical Development Division <span>{row.image ? "Picture attached" : "No picture attached"}</span></footer>
    </article>
    <section className="screen-only complaint-handling"><h2>Update handling status</h2><StatusForm reference={row.reference} current={row.handlingStatus} /></section>
  </main>;
}
