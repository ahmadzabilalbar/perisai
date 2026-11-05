import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { canEditContent, getSession } from "@/lib/auth";

// The browser crops and resizes every cover to 1200×675 before sending (see CoverImageInput),
// which comes out around 100–300 KB. Anything over this cap didn't go through that step.
const MAX_BYTES = 1024 * 1024;

/** Recognises the image by its first bytes rather than trusting the browser's file type.
 * Only the formats CoverImageInput produces are accepted. */
function imageType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Uploads a cover image to Vercel Blob and returns its public URL. Admins, editors and super admins only. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Sila log masuk semula.", 401);
  if (!canEditContent(session.role)) return fail("Akses lihat sahaja: anda tidak boleh memuat naik gambar.", 403);
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return fail("Storan gambar belum disediakan (Vercel Blob). Tampal URL gambar sebagai ganti.", 503);
  }

  // Refuse oversized uploads before reading the body (allowing a little for the multipart wrapping)
  if (Number(req.headers.get("content-length")) > MAX_BYTES + 16 * 1024) return fail("Gambar terlalu besar (had 1 MB).", 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return fail("Muat naik tidak sah.", 400);
  }
  if (!(file instanceof File) || file.size === 0) return fail("Tiada fail dipilih.", 400);
  if (file.size > MAX_BYTES) return fail("Gambar terlalu besar (had 1 MB).", 413);

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return fail("Hanya gambar JPG atau WebP dibenarkan.", 415);

  try {
    const blob = await put(`covers/${randomUUID()}.${type.ext}`, bytes, {
      access: "public",
      contentType: type.mime,
      cacheControlMaxAge: 60 * 60 * 24 * 365, // name is unique, so the file never changes
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Blob upload failed", e);
    return fail("Gagal memuat naik gambar. Cuba lagi.", 502);
  }
}
