"use client";

import { IconDownload } from "@/components/Icons";

/** Opens the browser's print dialog, where "Save as PDF" exports the page. Hidden in the printout itself. */
export function PrintButton({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary shrink-0 print:hidden">
      <IconDownload className="size-4" /> {label}
    </button>
  );
}
