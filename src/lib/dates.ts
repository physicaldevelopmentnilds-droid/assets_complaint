export function assertBusinessDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use a YYYY-MM-DD date.");
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Invalid calendar date.");
  return date;
}

export function lagosDate(timestamp: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(timestamp);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function lagosDayBounds(date: string): { start: Date; endExclusive: Date } {
  assertBusinessDate(date);
  const start = new Date(`${date}T00:00:00+01:00`);
  return { start, endExclusive: new Date(start.getTime() + 86_400_000) };
}
