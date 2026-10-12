"use client";
import { useState, type FormEvent } from "react";
import { BUILDING_SECTIONS, COMPLAINT_TYPES } from "@/modules/complaints/validation";

export default function ComplaintForm() {
  const [type, setType] = useState("");
  const [building, setBuilding] = useState("");
  const [submission, setSubmission] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    form.set("idempotencyKey", key);
    try {
      const result = await fetch("/api/complaints", { method: "POST", body: form });
      const body = await result.json();
      if (!result.ok) { setError(body.error || "Submission failed. Please retry."); return; }
      setReference(body.reference); setKey(crypto.randomUUID());
    } catch { setError("Unable to reach the server. Your form is retained; retry when connected."); }
    finally { setPending(false); }
  }
  if (reference) return <section className="success" role="status"><h2>Complaint received</h2><p>Your reference is <strong>{reference}</strong>. Please save it for follow-up.</p><button className="button" onClick={() => { setReference(""); setType(""); setBuilding(""); setSubmission(""); }}>Submit another</button></section>;
  return <form onSubmit={submit} className="complaint-form"><label>Complaint type<select name="complaintType" required value={type} onChange={(event) => setType(event.target.value)}><option value="">Select a type</option>{COMPLAINT_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>{type === "Other" && <label>Specify complaint type<input name="complaintTypeOther" required maxLength={200} /></label>}<label className="wide">Complaint description<textarea name="description" rows={5} required maxLength={10000} /></label><label>Submission type<select name="submissionType" required value={submission} onChange={(event) => setSubmission(event.target.value)}><option value="">Select submission type</option><option>First complaint</option><option>Reminder</option></select></label>{submission === "Reminder" && <label>Previous complaint reference (optional)<input name="previousReference" placeholder="ASSET-2026-000001" /></label>}<label>Building section<select name="buildingSection" required value={building} onChange={(event) => setBuilding(event.target.value)}><option value="">Select a section</option>{BUILDING_SECTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>{building === "Other" && <label>Specify building section<input name="buildingSectionOther" required maxLength={200} /></label>}<label>Floor<input name="floor" required maxLength={500} /></label><label>Location (Office number, optional)<input name="officeNumber" maxLength={500} /></label><label>Name of complainant<input name="complainantName" required maxLength={500} /></label><label>Department of complainant<input name="department" required maxLength={500} /></label><label>Designation of complainant<input name="designation" required maxLength={500} /></label><label>Contact number<input name="contactNumber" type="tel" required maxLength={40} /></label><label className="wide">Picture, if any<input name="picture" type="file" accept="image/jpeg,image/png,image/webp" /></label>{error && <p role="alert" className="error wide">{error}</p>}<div className="wide"><button className="button" disabled={pending}>{pending ? "Submitting…" : "Submit complaint"}</button></div></form>;
}
