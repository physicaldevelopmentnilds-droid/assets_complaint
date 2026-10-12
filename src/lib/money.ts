export const CASHBOOK_START_DATE = "2026-10-15";
export const OPENING_BALANCE_KOBO = 0;

export function parseNairaToKobo(value: string): number {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) throw new Error("Enter an amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(kobo) || kobo <= 0) throw new Error("Enter a positive amount within the supported range.");
  return kobo;
}

export function formatKobo(kobo: number): string {
  if (!Number.isSafeInteger(kobo)) throw new Error("Invalid kobo amount.");
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}
