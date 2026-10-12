import { requireStaff } from "@/lib/auth";
import { CASHBOOK_START_DATE, formatKobo, OPENING_BALANCE_KOBO } from "@/lib/money";
import Notifications from "./notifications";
export const runtime = "nodejs";
export default async function SettingsPage() {
  await requireStaff();
  return <main><p className="eyebrow">Division configuration</p><h1>Settings</h1><section><h2>Cashbook opening</h2><p>Effective date: {CASHBOOK_START_DATE}</p><p>Opening balance: {formatKobo(OPENING_BALANCE_KOBO)}</p><p>These values are fixed for V1.</p></section><section><h2>Device notifications</h2><Notifications publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""} /></section></main>;
}
