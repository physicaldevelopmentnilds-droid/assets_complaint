import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import MemoForm from "../memo-form";
export const runtime = "nodejs";
export default async function MemoDetail({ params }: { params: Promise<{ reference: string }> }) {
  await requireStaff();
  const { reference } = await params;
  const row = await (await database()).collection("memos").findOne({ reference });
  if (!row) notFound();
  return <main><Link href="/memos">← Back to memos</Link><p className="eyebrow">Memo Tracking</p><h1>{reference}</h1><p>Created {new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(row.createdAt)}</p><p><a className="button" href={`/api/memos/${reference}/pdf`}>Download PDF</a></p><section><h2>Update memo</h2><MemoForm reference={reference} initial={{ subject: row.subject, draftedBy: row.draftedBy, recipient: row.recipient, reviewed: row.reviewed, approved: row.approved, submittedToRegistry: row.submittedToRegistry, registryDate: row.registryDate, projectProgress: row.projectProgress, projectExecuted: row.projectExecuted }} /></section></main>;
}
