"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function VoidButton({ reference }: { reference: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!reason.trim()) { setError("Enter a reason."); return; }
    const response = await fetch(`/api/cashbook/${reference}/void`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
    if (!response.ok) { setError((await response.json()).error || "Could not void entry."); return; }
    setEditing(false); router.refresh();
  }
  return editing ? <div className="void-form"><label>Void reason<input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></label><button type="button" onClick={save}>Confirm void</button><button type="button" onClick={() => setEditing(false)}>Cancel</button>{error && <span role="alert">{error}</span>}</div> : <button type="button" onClick={() => setEditing(true)}>Void</button>;
}
