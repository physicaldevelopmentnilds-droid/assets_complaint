"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HANDLING_STATUSES } from "@/modules/complaints/validation";
export default function StatusForm({ reference, current }: { reference: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const response = await fetch(`/api/complaints/${reference}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ handlingStatus: status }) });
    setMessage(response.ok ? "Status updated." : (await response.json()).error || "Update failed.");
    if (response.ok) router.refresh();
  }
  return <form onSubmit={submit} className="stack"><label>Handling status<select value={status} onChange={(event) => setStatus(event.target.value)}>{HANDLING_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><button className="button">Save status</button>{message && <p role="status">{message}</p>}</form>;
}
