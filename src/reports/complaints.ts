import sharp from "sharp";
import { PdfReport } from "./pdf";
import { complaintImageFormat, fetchComplaintImage, type ComplaintImage } from "@/modules/complaints/image";

export type ComplaintReportRow = Record<string, unknown> & { reference: string; submittedAt: Date; image?: ComplaintImage | null };

export async function complaintPdf(rows: ComplaintReportRow[], title: string, filters: string, includePictures: boolean) {
  const single = includePictures && rows.length === 1;
  const pdf = await PdfReport.create(title, !single);
  const fields = (row: ComplaintReportRow): [string, unknown][] => [
    ["Reference", row.reference],
    ["Submitted (Africa/Lagos)", new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(row.submittedAt)],
    ["Complaint type", row.complaintType === "Other" ? `${row.complaintType}: ${row.complaintTypeOther}` : row.complaintType],
    ["Description", row.description], ["Submission type", row.submissionType], ["Previous reference", row.previousReference],
    ["Building section", row.buildingSection === "Other" ? `${row.buildingSection}: ${row.buildingSectionOther}` : row.buildingSection],
    ["Floor", row.floor], ["Office number", row.officeNumber], ["Complainant", row.complainantName], ["Department", row.department],
    ["Designation", row.designation], ["Contact number", row.contactNumber], ["Handling status", row.handlingStatus]
  ];
  if (single) {
    const row = rows[0];
    let picture;
    let pictureStatus = "None attached";
    if (row.image) {
      try {
        const bytes = await fetchComplaintImage(row.image);
        const format = complaintImageFormat(row.image.format);
        picture = { bytes: format === "webp" ? await sharp(bytes).png().toBuffer() : bytes, format: format === "jpeg" ? "jpeg" : "png" };
        pictureStatus = "Attached";
      } catch { pictureStatus = "Attached picture is currently unavailable"; }
    }
    await pdf.singleComplaint([...fields(row), ["Picture", pictureStatus]], picture);
  } else {
    pdf.field("Selected filters", filters || "All complaints");
    pdf.field("Number of complaints", rows.length);
    if (!rows.length) pdf.text("No complaints match the selected filters.");
    pdf.table(["Reference", "Submission (Lagos)", "Complaint type", "Description", "Location", "Complainant", "Status", "Picture"], rows.map((row) => {
      const data = fields(row);
      return [row.reference, `${data[1][1]}\n${row.submissionType}\nPrevious: ${row.previousReference || "-"}`, data[2][1], row.description,
        `${data[6][1]}\nFloor: ${row.floor}\nOffice: ${row.officeNumber || "-"}`,
        `${row.complainantName}\nDepartment: ${row.department}\nDesignation: ${row.designation}\nPhone: ${row.contactNumber}`,
        row.handlingStatus, row.image ? "Attached; see individual complaint" : "None"];
    }), [1.3, 1.8, 1.7, 3, 2, 2.6, 1, 1]);
  }
  return pdf.save();
}
