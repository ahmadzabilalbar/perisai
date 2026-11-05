"use client";

import { useRef, useState } from "react";

// Every cover is stored at exactly this size: 16:9, the frame used on cards and post pages
// (shown at most ~1150px wide). Keeps each file around 100–300 KB.
const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const QUALITY = 0.82;

/** Center-crops the photo to 16:9, scales it to COVER_WIDTH × COVER_HEIGHT and re-encodes it
 * (WebP, or JPEG where the browser can't write WebP). Smaller photos are scaled up to fill the frame. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const target = COVER_WIDTH / COVER_HEIGHT;
  // Largest 16:9 area in the middle of the photo
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > target) sw = sh * target;
  else sh = sw / target;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, COVER_WIDTH, COVER_HEIGHT);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, QUALITY));
  const webp = await encode("image/webp");
  // Safari silently falls back to PNG for WebP, which is far bigger than JPEG for photos
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

/** Cover image field: upload a photo (stored in Vercel Blob) or paste an image URL. Submits as `coverImage`. */
export function CoverImageInput({
  defaultValue = "",
  onChange,
}: {
  defaultValue?: string;
  /** Called with the new URL (or "") whenever the cover changes */
  onChange?: (url: string) => void;
}) {
  const [url, setUrlState] = useState(defaultValue);
  const setUrl = (u: string) => {
    setUrlState(u);
    onChange?.(u);
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Sila pilih fail gambar.");
    setBusy(true);
    try {
      let blob: Blob;
      try {
        blob = await shrink(file);
      } catch {
        return setError("Gambar ini tidak dapat dibaca. Cuba format JPG atau PNG.");
      }
      const fd = new FormData();
      fd.append("file", blob, file.name);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) return setError(data.error || "Gagal memuat naik gambar. Cuba lagi.");
      setUrl(data.url);
    } catch {
      setError("Gagal memuat naik gambar. Semak sambungan internet dan cuba lagi.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="label">Gambar muka depan</label>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover" />
      ) : (
        <div className="grid aspect-[16/9] w-full place-items-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
          Tiada gambar
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-secondary flex-1 text-sm"
        >
          {busy ? "Memuat naik…" : url ? "Tukar gambar" : "Muat naik gambar"}
        </button>
        {url && !busy && (
          <button type="button" onClick={() => setUrl("")} className="btn-secondary text-sm">
            Buang
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <p className="text-xs text-slate-500">
        Gambar dipotong ke nisbah 16:9 (bahagian tengah) dan disimpan pada {COVER_WIDTH}×{COVER_HEIGHT} piksel.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        name="coverImage"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="atau tampal URL gambar: https://…"
        className="input text-xs"
      />
    </div>
  );
}
