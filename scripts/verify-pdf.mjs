import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { PdfReport } from "../src/reports/pdf.ts";

const report = await PdfReport.create("PDF verification sample");
report.field("Currency", "₦1,000.10");
report.field("Unicode", "NILDS — café · résumé");
report.field("Long description", "The office fixture requires inspection. ".repeat(500));
const bytes = await report.save();
const parsed = await PDFDocument.load(bytes);
if (parsed.getPageCount() < 2) throw new Error("Long text did not paginate.");
await mkdir(".tmp", { recursive: true });
await writeFile(".tmp/pdf-verification.pdf", bytes);
process.stdout.write(`Unicode PDF generated with ${parsed.getPageCount()} pages.\n`);
