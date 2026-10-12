import { formatKobo, CASHBOOK_START_DATE } from "@/lib/money";
import { type CashbookEntry, type LedgerFilters, calculateLedger } from "@/modules/cashbook/ledger";
import { PdfReport } from "./pdf";

export async function cashbookPdf(entries: CashbookEntry[], filters: LedgerFilters, labels: string) {
  const ledger = calculateLedger(entries, filters);
  const pdf = await PdfReport.create("Cashbook Report", true);
  pdf.field("Selected filters", labels || "All entered dates; all types");
  pdf.text(`Commencement: ${CASHBOOK_START_DATE} | Opening: ${formatKobo(ledger.openingBalanceKobo)} | Closing: ${formatKobo(ledger.closingBalanceKobo)}`);
  pdf.text(`Period income: ${formatKobo(ledger.periodIncomeKobo)} | Period expenditure: ${formatKobo(ledger.periodExpenditureKobo)}`);
  pdf.text(`Filtered income: ${formatKobo(ledger.filteredIncomeKobo)} | Filtered expenditure: ${formatKobo(ledger.filteredExpenditureKobo)}`);
  pdf.text("Running balances include transactions hidden by type and search filters.");
  if (!ledger.rows.length) pdf.text("No transactions match the selected filters.");
  pdf.table(["Date", "Reference", "Description", "Receipt/voucher", "Income", "Expenditure", "Running balance", "Status"], ledger.rows.map((row) => [row.transactionDate, row.reference, row.description, row.receiptReference, row.type === "Income" ? formatKobo(row.amountKobo) : "", row.type === "Expenditure" ? formatKobo(row.amountKobo) : "", formatKobo(row.runningBalanceKobo), row.voidedAt ? `Voided: ${row.voidReason || "Reason unavailable"}` : "Valid"]), [1, 1.5, 3, 1.2, 1.2, 1.2, 1.3, 1.5]);
  return pdf.save();
}
