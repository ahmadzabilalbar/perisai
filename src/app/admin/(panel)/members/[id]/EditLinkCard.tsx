"use client";

import { useEffect, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { whatsappShareUrl } from "@/lib/format";
import { generateEditLink } from "../../../actions";

export function EditLinkCard({ memberId, name, token }: { memberId: string; name: string; token: string }) {
  // The site's own address is only known in the browser
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const url = token ? `${origin}/kemaskini/${token}` : "";
  const message = `Salam ${name}, sila kemas kini maklumat anak anda untuk PERISAI melalui pautan peribadi ini: ${url}`;
  const waUrl = whatsappShareUrl(message);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card space-y-3 p-5">
      <div>
        <h2 className="font-semibold text-slate-900">Pautan kemas kini anak</h2>
        <p className="text-xs text-slate-500">
          Hantar pautan peribadi ini kepada ahli supaya mereka boleh mengemas kini maklumat anak sendiri. Jangan
          kongsikan dengan orang lain.
        </p>
      </div>

      {token ? (
        <>
          <input readOnly value={url} onFocus={(e) => e.target.select()} className="input font-mono !text-xs" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-secondary !px-3 !py-1.5 !text-xs">
              {copied ? "Disalin!" : "Salin pautan"}
            </button>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5 !text-xs">
              Hantar melalui WhatsApp
            </a>
          </div>
          <form action={generateEditLink.bind(null, memberId)}>
            <ConfirmButton
              message="Jana pautan baharu? Pautan lama tidak akan berfungsi lagi."
              className="btn-ghost !px-0 !py-1 !text-xs !text-rose-600"
            >
              Jana semula (batalkan pautan lama)
            </ConfirmButton>
          </form>
        </>
      ) : (
        <form action={generateEditLink.bind(null, memberId)}>
          <button className="btn-primary w-full">Jana pautan</button>
        </form>
      )}
    </div>
  );
}
