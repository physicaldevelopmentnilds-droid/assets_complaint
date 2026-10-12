export type PushFailure = "expired" | "permanent" | "temporary";
export function classifyPushFailure(statusCode: number | undefined): PushFailure {
  if (statusCode === 404 || statusCode === 410) return "expired";
  if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) return "permanent";
  return "temporary";
}
export function retryDelayMs(attempt: number): number {
  return Math.min(6 * 60 * 60_000, 30_000 * 2 ** Math.min(10, Math.max(0, attempt - 1)));
}
export function privatePushPayload(kind: "new" | "reminder", reference: string) {
  if (!/^ASSET-\d{4}-\d{6}$/.test(reference)) throw new Error("Invalid complaint reference.");
  return JSON.stringify({ kind, reference });
}
