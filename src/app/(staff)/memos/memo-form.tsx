"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
type Values = { subject: string; draftedBy: string; recipient: string; reviewed: boolean; approved: boolean; submittedToRegistry: boolean; registryDate: string | null; projectProgress: number; projectExecuted: boolean };
const empty: Values = { subject: "", draftedBy: "", recipient: "", reviewed: false, approved: false, submittedToRegistry: false, registryDate: null, projectProgress: 0, projectExecuted: false };
export default function MemoForm({ initial, reference }: { initial?: Values; reference?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial || empty);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const update = <K extends keyof Values>(key: K, next: Values[K]) => setValue((old) => ({ ...old, [key]: next }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const response = await fetch(reference ? `/api/memos/${reference}` : "/api/memos", { method: reference ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
      const body = await response.json();
      if (!response.ok) { setError(body.error || "Unable to save memo."); return; }
      router.push(`/memos/${reference || body.reference}`); router.refresh();
    } catch { setError("Unable to reach the server."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="complaint-form"><label className="wide">Memo subject<input required maxLength={500} value={value.subject} onChange={(e) => update("subject", e.target.value)} /></label><label>Drafted by<input required maxLength={200} value={value.draftedBy} onChange={(e) => update("draftedBy", e.target.value)} /></label><label>Recipient<input required maxLength={200} value={value.recipient} onChange={(e) => update("recipient", e.target.value)} /></label><label className="check"><input type="checkbox" checked={value.reviewed} onChange={(e) => update("reviewed", e.target.checked)} />Reviewed</label><label className="check"><input type="checkbox" checked={value.approved} onChange={(e) => update("approved", e.target.checked)} />Approved</label><label className="check"><input type="checkbox" checked={value.submittedToRegistry} onChange={(e) => setValue((old) => ({ ...old, submittedToRegistry: e.target.checked, registryDate: e.target.checked ? old.registryDate : null }))} />Submitted to the registry</label>{value.submittedToRegistry && <label>Date submitted to the registry<input type="date" required value={value.registryDate || ""} onChange={(e) => update("registryDate", e.target.value || null)} /></label>}<label>Project progress (%)<input type="number" min={0} max={100} required value={value.projectProgress} onChange={(e) => { const n = Number(e.target.value); setValue((old) => ({ ...old, projectProgress: n, projectExecuted: n === 100 })); }} /></label><label className="check"><input type="checkbox" checked={value.projectExecuted} onChange={(e) => setValue((old) => ({ ...old, projectExecuted: e.target.checked, projectProgress: e.target.checked ? 100 : 0 }))} />Project executed</label>{error && <p role="alert" className="error wide">{error}</p>}<div className="wide"><button className="button" disabled={pending}>{pending ? "Saving…" : reference ? "Save changes" : "Create memo"}</button></div></form>;
}
