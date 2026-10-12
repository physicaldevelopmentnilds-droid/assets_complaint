import { PdfReport } from "./pdf";
export type MemoReportRow = Record<string, unknown> & { reference: string };
export async function memoPdf(rows: MemoReportRow[], title: string, filters: string) {
  const pdf = await PdfReport.create(title, title !== "Memo");
  pdf.field("Selected filters", filters || "All memos");
  pdf.field("Number of memos", rows.length);
  if (!rows.length) pdf.text("No memos match the selected filters.");
  pdf.table(["Reference", "Subject", "Drafted by", "Recipient", "Reviewed", "Approved", "Registry", "Registry date", "Progress", "Executed"], rows.map((row) => [row.reference, row.subject, row.draftedBy, row.recipient, row.reviewed ? "Yes" : "No", row.approved ? "Yes" : "No", row.submittedToRegistry ? "Yes" : "No", row.registryDate, `${row.projectProgress}%`, row.projectExecuted ? "Yes" : "No"]), [1.3, 2.5, 1.4, 1.4, 0.8, 0.8, 0.8, 1.1, 0.8, 0.8]);
  return pdf.save();
}
