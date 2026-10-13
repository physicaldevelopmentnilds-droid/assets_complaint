import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/database-errors";
import LoginForm from "./login-form";
import Brand from "../brand";
import Link from "next/link";
export const runtime = "nodejs";
export default async function LoginPage() {
  let staff;
  let databaseUnavailable = false;
  try {
    staff = await currentStaff();
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    databaseUnavailable = true;
  }
  if (staff) redirect("/dashboard");
  return <main className="auth-shell"><section className="auth-identity"><Brand /><div className="auth-identity-copy"><p className="eyebrow national-assembly">National Assembly</p><h1>Physical Development Division</h1><p>Operations workspace for assets complaints, memo tracking and cashbook records.</p></div><p className="auth-footnote">National Institute for Legislative and Democratic Studies</p></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">Staff access</p><h2>Sign in</h2><p>Enter your staff credentials to continue.</p>{databaseUnavailable && <p role="alert" className="error">The database is temporarily unavailable. Sign-in cannot complete until the connection is restored. Please try again later.</p>}<LoginForm /><p className="auth-public-link">Need to report an issue? <Link href="/complaints/new">Open the public asset complaint form</Link></p></div></section></main>;
}
