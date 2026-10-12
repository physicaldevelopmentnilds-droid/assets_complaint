import { mkdir, writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { PdfReport } from "../src/reports/pdf.ts";

await mkdir(".tmp/layout-review", { recursive: true });
for (const long of [false, true]) {
  const pdf = await PdfReport.create("Asset Complaint");
  const fields = [["Reference", "ASSET-2026-000001"], ["Submitted (Africa/Lagos)", "9 October 2026, 10:00"], ["Complaint type", "Furniture"], ["Description", long ? "Fixture inspection required. ".repeat(350) : "The office desk requires repair. Please inspect the damaged support and arrange maintenance."], ["Submission type", "First complaint"], ["Previous reference", ""], ["Building section", "Administrative Block"], ["Floor", "Ground"], ["Office number", ""], ["Complainant", "Synthetic sample"], ["Department", "Sample department"], ["Designation", "Sample officer"], ["Contact number", "08000000000"], ["Handling status", "Received"], ["Picture", "Synthetic image"]];
  await pdf.singleComplaint(fields, { bytes: await readFile("public/nilds-logo.jpeg"), format: "jpeg" });
  const bytes = await pdf.save();
  const parsed = await PDFDocument.load(bytes);
  assert.equal(parsed.getPageCount(), 1);
  await writeFile(`.tmp/layout-review/complaint-${long ? "long" : "normal"}.pdf`, bytes);
}
const pdf = await PdfReport.create("Landscape table verification", true);
pdf.field("Selected filters", "Synthetic sample; all records");
pdf.table(["Date", "Reference", "Description", "Income", "Balance"], Array.from({ length: 70 }, (_, i) => ["2026-10-15", `CASH-2026-${i + 1}`, i === 35 ? "Long description ".repeat(300) : `Synthetic transaction ${i + 1}`, "₦1,000.10", "₦2,000.20"]), [1, 1.5, 4, 1, 1]);
const bytes = await pdf.save();
const parsed = await PDFDocument.load(bytes);
assert.ok(parsed.getPageCount() > 1);
for (const page of parsed.getPages()) assert.ok(page.getWidth() > page.getHeight());
await writeFile(".tmp/layout-review/landscape-table.pdf", bytes);
console.log(`Two one-page complaint layouts and a ${parsed.getPageCount()}-page landscape table verified.`);
