"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      if (!response.ok) { setError((await response.json()).error || "Sign in failed"); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("Unable to reach the server."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="stack"><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p role="alert" className="error">{error}</p>}<button className="button" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button></form>;
}
