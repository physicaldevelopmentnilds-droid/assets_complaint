"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CASHBOOK_START_DATE } from "@/lib/money";
export default function TransactionForm() {
  const router = useRouter();
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    setPending(true); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/cashbook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transactionDate: data.get("transactionDate"), description: data.get("description"), type: data.get("type"), amount: data.get("amount"), receiptReference: data.get("receiptReference"), idempotencyKey: key }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error || "Could not save transaction."); return; }
      setKey(crypto.randomUUID()); form.reset(); router.refresh();
    } catch { setError("Unable to reach the server. Your form is retained."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="complaint-form"><label>Transaction date<input name="transactionDate" type="date" min={CASHBOOK_START_DATE} defaultValue={CASHBOOK_START_DATE} required /></label><label>Type<select name="type" required><option value="Income">Income</option><option value="Expenditure">Expenditure</option></select></label><label className="wide">Description<input name="description" required maxLength={1000} /></label><label>Amount (NGN)<input name="amount" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required placeholder="0.00" /></label><label>Receipt/voucher reference (optional)<input name="receiptReference" maxLength={200} /></label>{error && <p role="alert" className="error wide">{error}</p>}<div className="wide"><button className="button" disabled={pending}>{pending ? "Saving…" : "Add transaction"}</button></div></form>;
}
