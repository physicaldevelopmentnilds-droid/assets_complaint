import { currentStaff } from "@/lib/auth";
import { database } from "@/lib/db";
import { complaintImageFormat, fetchComplaintImage, type ComplaintImage } from "@/modules/complaints/image";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    if (!await currentStaff()) return new Response("UNAUTHORIZED", { status: 401 });
    const { reference } = await params;
    const row = await (await database()).collection("assetComplaints").findOne({ reference }, { projection: { image: 1 } });
    if (!row?.image) return new Response("Not found", { status: 404 });
    const image = row.image as ComplaintImage;
    const bytes = await fetchComplaintImage(image);
    const contentType = `image/${complaintImageFormat(image.format)}`;
    return new Response(new Uint8Array(bytes), { headers: { "content-type": contentType, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch { return new Response("Image unavailable", { status: 404 }); }
}
