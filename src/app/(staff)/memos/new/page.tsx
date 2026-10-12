import MemoForm from "../memo-form";
import { requireStaff } from "@/lib/auth";
export const runtime = "nodejs";
export default async function NewMemoPage() { await requireStaff(); return <main><p className="eyebrow">Memo Tracking</p><h1>New memo</h1><section><MemoForm /></section></main>; }
