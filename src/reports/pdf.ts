import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 48;
const NAVY = rgb(0.06, 0.16, 0.36);
const BLUE = rgb(0.09, 0.27, 0.65);
const GREEN = rgb(0.1, 0.42, 0.29);
const GOLD = rgb(0.83, 0.64, 0.14);

export class PdfReport {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private logo!: PDFImage;
  private page!: PDFPage;
  private y = 0;
  private title: string;
  private generatedAt = new Date();

  private landscape: boolean;
  private constructor(title: string, landscape = false) { this.title = title; this.landscape = landscape; }

  private get width() { return this.landscape ? HEIGHT : WIDTH; }
  private get height() { return this.landscape ? WIDTH : HEIGHT; }

  static async create(title: string, landscape = false) {
    const report = new PdfReport(title, landscape);
    report.doc = await PDFDocument.create();
    report.doc.registerFontkit(fontkit);
    const bytes = await readFile(path.join(process.cwd(), "assets", "fonts", "NotoSans.ttf"));
    report.font = await report.doc.embedFont(bytes, { subset: true });
    report.logo = await report.doc.embedJpg(await readFile(path.join(process.cwd(), "public", "nilds-logo.jpeg")));
    report.addPage();
    return report;
  }

  private addPage() {
    this.page = this.doc.addPage([this.width, this.height]);
    this.y = this.height - MARGIN;
    this.page.drawImage(this.logo, { x: MARGIN, y: this.height - MARGIN - 52, width: 51, height: 52 });
    this.page.drawText("National Institute for Legislative and Democratic Studies", { x: MARGIN + 65, y: this.y - 16, font: this.font, size: 10, color: NAVY });
    this.page.drawText("National Assembly", { x: MARGIN + 65, y: this.y - 36, font: this.font, size: 9, color: rgb(0.72, 0.08, 0.12) });
    this.page.drawText(" | Physical Development Division", { x: MARGIN + 65 + this.font.widthOfTextAtSize("National Assembly", 9), y: this.y - 36, font: this.font, size: 9, color: GREEN });
    this.y -= 72;
    this.writeLine(this.title, 17, BLUE);
    this.y -= 12;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: this.width - MARGIN, y: this.y }, thickness: 2, color: GOLD });
    this.y -= 22;
  }

  private room(height: number) { if (this.y - height < MARGIN + 26) this.addPage(); }

  private writeLine(text: string, size = 10, color = NAVY) {
    this.room(size + 5);
    this.page.drawText(text, { x: MARGIN, y: this.y, font: this.font, size, color });
    this.y -= size + 6;
  }

  private wrap(text: string, size: number, width = this.width - 2 * MARGIN) {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        const proposed = line ? `${line} ${word}` : word;
        if (this.font.widthOfTextAtSize(proposed, size) <= width) { line = proposed; continue; }
        if (line) { lines.push(line); line = ""; }
        let fragment = "";
        for (const char of word) {
          if (this.font.widthOfTextAtSize(fragment + char, size) > width && fragment) { lines.push(fragment); fragment = ""; }
          fragment += char;
        }
        line = fragment;
      }
      lines.push(line || " ");
    }
    return lines;
  }

  text(text: unknown, size = 10) {
    for (const line of this.wrap(String(text ?? "—"), size)) this.writeLine(line, size);
  }

  field(label: string, value: unknown) {
    this.room(40);
    this.writeLine(label.toUpperCase(), 8, GREEN);
    this.text(value == null || value === "" ? "—" : value, 10);
    this.y -= 7;
  }

  section(text: string) { this.room(50); this.y -= 8; this.writeLine(text, 13, NAVY); }

  async picture(bytes: Buffer, format: string) {
    const image = format === "jpeg" ? await this.doc.embedJpg(bytes) : await this.doc.embedPng(bytes);
    const availableWidth = this.width - 2 * MARGIN;
    const scale = Math.min(availableWidth / image.width, 300 / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    this.room(height + 30);
    this.page.drawImage(image, { x: MARGIN, y: this.y - height, width, height });
    this.y -= height + 20;
  }


  table(headers: string[], rows: unknown[][], weights?: number[]) {
    const total = (weights || headers.map(() => 1)).reduce((a, b) => a + b, 0);
    const widths = (weights || headers.map(() => 1)).map((v) => (this.width - 2 * MARGIN) * v / total);
    const drawRow = (values: unknown[], header: boolean, offset = 0, count = Infinity) => {
      const lines = values.map((v, i) => this.wrap(String(v == null || v === "" ? "-" : v), 7, widths[i] - 10).slice(offset, offset + count));
      const height = Math.max(...lines.map((v) => v.length), 1) * 10 + 12;
      let x = MARGIN;
      lines.forEach((cell, i) => {
        this.page.drawRectangle({ x, y: this.y - height, width: widths[i], height, color: header ? BLUE : rgb(0.97, 0.98, 1), borderWidth: 0.4, borderColor: rgb(0.8, 0.85, 0.9) });
        cell.forEach((line, n) => this.page.drawText(line, { x: x + 5, y: this.y - 12 - n * 10, size: 7, font: this.font, color: header ? rgb(1, 1, 1) : NAVY }));
        x += widths[i];
      });
      this.y -= height;
    };
    this.room(40); drawRow(headers, true);
    for (const values of rows) {
      const length = Math.max(...values.map((v, i) => this.wrap(String(v ?? "-"), 7, widths[i] - 10).length));
      let offset = 0;
      while (offset < length) {
        let capacity = Math.floor((this.y - MARGIN - 26 - 12) / 10);
        if (capacity < Math.min(length - offset, 3)) { this.addPage(); drawRow(headers, true); capacity = Math.floor((this.y - MARGIN - 26 - 12) / 10); }
        const count = Math.min(capacity, length - offset);
        drawRow(values, false, offset, count); offset += count;
      }
    }
  }

  async singleComplaint(fields: [string, unknown][], picture?: { bytes: Buffer; format: string }) {
    const values = new Map(fields.map(([label, value]) => [label, String(value == null || value === "" ? "Not provided" : value).replace(/\s+/g, " ").trim()]));
    const image = picture ? (picture.format === "jpeg" ? await this.doc.embedJpg(picture.bytes) : await this.doc.embedPng(picture.bytes)) : null;
    const groups = [
      { title: "01  /  Submission", labels: ["Reference", "Submitted (Africa/Lagos)", "Submission type", "Previous reference", "Handling status"] },
      { title: "02  /  Asset and location", labels: ["Complaint type", "Building section", "Floor", "Office number"] },
      { title: "03  /  Complainant", labels: ["Complainant", "Department", "Designation", "Contact number"] }
    ];
    const used = new Set([...groups.flatMap((group) => group.labels), "Description", "Picture"]);
    const extra = fields.map(([label]) => label).filter((label) => !used.has(label));
    if (extra.length) groups.push({ title: "Additional details", labels: extra });
    const width = this.width - 2 * MARGIN;
    const cellWidth = (width - 12) / 2;
    const pictureHeight = image ? 105 : 30;
    let size = 9.5;
    let descriptionSize = 9.5;
    const rows = (labels: string[]) => Array.from({ length: Math.ceil(labels.length / 2) }, (_, i) => labels.slice(i * 2, i * 2 + 2));
    const rowHeight = (labels: string[]) => Math.max(...labels.map((label) => this.wrap(values.get(label) || "Not provided", size, cellWidth - 20).length)) * (size + 2) + 23;
    const descriptionHeight = () => this.wrap(values.get("Description") || "Not provided", descriptionSize, width - 24).length * (descriptionSize + 2) + 28;
    const measure = () => groups.reduce((total, group) => total + 22 + rows(group.labels).reduce((sum, row) => sum + rowHeight(row) + 5, 0), 0) + 27 + descriptionHeight() + pictureHeight;
    while (measure() > this.y - MARGIN - 26 && descriptionSize > 1) descriptionSize -= 0.25;
    while (measure() > this.y - MARGIN - 26 && size > 1) size -= 0.25;
    const heading = (title: string) => {
      this.page.drawText(title.toUpperCase(), { x: MARGIN, y: this.y - 9, font: this.font, size: 8, color: BLUE });
      this.y -= 22;
    };
    for (const group of groups) {
      heading(group.title);
      for (const row of rows(group.labels)) {
        const height = rowHeight(row);
        row.forEach((label, i) => {
          const x = MARGIN + i * (cellWidth + 12);
          this.page.drawRectangle({ x, y: this.y - height, width: cellWidth, height, color: rgb(0.96, 0.97, 0.99), borderColor: rgb(0.87, 0.90, 0.94), borderWidth: 0.5 });
          this.page.drawText(label.toUpperCase(), { x: x + 10, y: this.y - 10, font: this.font, size: 6.5, color: GREEN });
          this.wrap(values.get(label) || "Not provided", size, cellWidth - 20).forEach((line, n) => this.page.drawText(line, { x: x + 10, y: this.y - 22 - n * (size + 2), font: this.font, size, color: label === "Handling status" ? BLUE : NAVY }));
        });
        this.y -= height + 5;
      }
      if (group.title.startsWith("02")) {
        heading("Description of issue");
        const height = descriptionHeight();
        this.page.drawRectangle({ x: MARGIN, y: this.y - height, width, height, color: rgb(1, 0.99, 0.95), borderColor: GOLD, borderWidth: 0.5 });
        this.wrap(values.get("Description") || "Not provided", descriptionSize, width - 24).forEach((line, n) => this.page.drawText(line, { x: MARGIN + 12, y: this.y - 17 - n * (descriptionSize + 2), font: this.font, size: descriptionSize, color: NAVY }));
        this.y -= height + 5;
      }
    }
    this.page.drawText("ATTACHED PICTURE", { x: MARGIN, y: this.y - 8, font: this.font, size: 7, color: GREEN });
    if (image) {
      const scale = Math.min((width - 150) / image.width, 80 / image.height);
      this.page.drawImage(image, { x: MARGIN + 150, y: this.y - 90, width: image.width * scale, height: image.height * scale });
    } else {
      this.page.drawText(values.get("Picture") || "None attached", { x: MARGIN + 125, y: this.y - 8, font: this.font, size: 8, color: NAVY });
    }
  }

  async save() {
    const pages = this.doc.getPages();
    const stamp = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(this.generatedAt);
    pages.forEach((page, index) => {
      page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: this.width - MARGIN, y: 42 }, thickness: 0.5, color: GOLD });
      page.drawText(`Generated ${stamp} (Africa/Lagos)`, { x: MARGIN, y: 27, size: 8, font: this.font, color: NAVY });
      page.drawText(`Page ${index + 1} of ${pages.length}`, { x: this.width - MARGIN - 75, y: 27, size: 8, font: this.font, color: NAVY });
    });
    return this.doc.save();
  }
}
