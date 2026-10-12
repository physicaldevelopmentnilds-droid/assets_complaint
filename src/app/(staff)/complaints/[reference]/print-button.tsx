"use client";
import { useEffect, useState } from "react";
export default function PrintButton({ reference }: { reference: string }) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function print() {
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/complaints/${reference}/pdf`);
      if (!response.ok) throw new Error("Could not prepare the complaint for printing.");
      setUrl(URL.createObjectURL(await response.blob()));
    } catch { setError("Could not prepare the complaint. Check the connection and retry."); }
    finally { setPending(false); }
  }
  return <><button type="button" className="button secondary" disabled={pending} onClick={print}>{pending ? "Preparing…" : "Print Complaint"}</button>{error && <span role="alert">{error}</span>}{url && <><iframe title="Complaint print document" className="print-frame" src={url} onLoad={(event) => event.currentTarget.contentWindow?.print()} /><a href={url} target="_blank" rel="noreferrer">Open printable PDF</a></>}</>;
}
