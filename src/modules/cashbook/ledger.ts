export type CashbookType = "Income" | "Expenditure";
export type CashbookEntry = {
  reference: string;
  transactionDate: string;
  sequence: number;
  description: string;
  type: CashbookType;
  amountKobo: number;
  receiptReference?: string | null;
  voidedAt?: Date | null;
  voidReason?: string | null;
};
export type LedgerFilters = { from?: string; to?: string; type?: CashbookType; search?: string };
export type LedgerRow<T extends CashbookEntry> = T & { runningBalanceKobo: number };

function safeAdd(a: number, b: number): number {
  const total = a + b;
  if (!Number.isSafeInteger(total)) throw new Error("Cashbook total exceeds the supported range.");
  return total;
}
const signed = (entry: CashbookEntry) => entry.type === "Income" ? entry.amountKobo : -entry.amountKobo;

export function calculateLedger<T extends CashbookEntry>(entries: T[], filters: LedgerFilters = {}) {
  if (filters.from && filters.to && filters.from > filters.to) throw new Error("End date precedes start date.");
  const ordered = [...entries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.sequence - b.sequence);
  let running = 0;
  let openingBalanceKobo = 0;
  let periodIncomeKobo = 0;
  let periodExpenditureKobo = 0;
  let filteredIncomeKobo = 0;
  let filteredExpenditureKobo = 0;
  const rows: LedgerRow<T>[] = [];
  const search = filters.search?.toLowerCase() || "";
  for (const entry of ordered) {
    if (!Number.isSafeInteger(entry.amountKobo) || entry.amountKobo <= 0 || !Number.isSafeInteger(entry.sequence)) throw new Error("Invalid stored cashbook entry.");
    if (filters.to && entry.transactionDate > filters.to) continue;
    if (filters.from && entry.transactionDate < filters.from) {
      if (!entry.voidedAt) running = safeAdd(running, signed(entry));
      openingBalanceKobo = running;
      continue;
    }
    if (!entry.voidedAt) {
      running = safeAdd(running, signed(entry));
      if (entry.type === "Income") periodIncomeKobo = safeAdd(periodIncomeKobo, entry.amountKobo);
      else periodExpenditureKobo = safeAdd(periodExpenditureKobo, entry.amountKobo);
    }
    const matches = (!filters.type || entry.type === filters.type) && (!search || `${entry.description} ${entry.reference} ${entry.receiptReference || ""}`.toLowerCase().includes(search));
    if (matches) {
      rows.push({ ...entry, runningBalanceKobo: running });
      if (!entry.voidedAt) {
        if (entry.type === "Income") filteredIncomeKobo = safeAdd(filteredIncomeKobo, entry.amountKobo);
        else filteredExpenditureKobo = safeAdd(filteredExpenditureKobo, entry.amountKobo);
      }
    }
  }
  return { openingBalanceKobo, periodIncomeKobo, periodExpenditureKobo, closingBalanceKobo: running, filteredIncomeKobo, filteredExpenditureKobo, rows };
}
