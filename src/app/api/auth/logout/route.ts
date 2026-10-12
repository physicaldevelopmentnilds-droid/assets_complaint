import { assertSameOrigin, errorResponse, invalidateSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST() {
  try { await assertSameOrigin(); await invalidateSession(); return Response.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
