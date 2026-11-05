"use client";

import { useActionState } from "react";
import { useCanEdit } from "@/components/AdminRole";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Settings } from "@/lib/data";
import { saveSettings } from "../../actions";

type FieldDef = { key: keyof Settings; label: string; type?: "textarea" | "url" | "email"; hint?: string; wide?: boolean };

const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Umum",
    fields: [
      { key: "siteName", label: "Nama pertubuhan" },
      { key: "tagline", label: "Slogan" },
    ],
  },
  {
    title: "Laman utama",
    fields: [
      { key: "heroTitle", label: "Tajuk utama (hero)", wide: true },
      { key: "heroSubtitle", label: "Subtajuk utama (hero)", type: "textarea", wide: true },
      { key: "heroImage", label: "URL gambar utama (hero)", type: "url", wide: true, hint: "Biarkan kosong untuk memaparkan ilustrasi kad ahli." },
      { key: "aboutTitle", label: "Tajuk bahagian Tentang Kami", wide: true },
      { key: "aboutBody", label: "Teks bahagian Tentang Kami", type: "textarea", wide: true, hint: "Menyokong Markdown." },
    ],
  },
  {
    title: "Yuran keahlian",
    fields: [
      { key: "currency", label: "Mata wang" },
      { key: "annualFee", label: "Yuran tahunan" },
      { key: "lifetimeFee", label: "Yuran seumur hidup" },
      { key: "feeNotes", label: "Catatan yuran", type: "textarea", wide: true },
      {
        key: "bankDetails",
        label: "Maklumat bayaran / bank",
        type: "textarea",
        wide: true,
        hint: "Dipaparkan di halaman Sertai. Menyokong Markdown.",
      },
    ],
  },
  {
    title: "Hubungan & media sosial",
    fields: [
      { key: "contactEmail", label: "E-mel", type: "email" },
      { key: "contactPhone", label: "No. telefon" },
      { key: "address", label: "Alamat", type: "textarea", wide: true },
      { key: "facebook", label: "URL Facebook", type: "url" },
      { key: "instagram", label: "URL Instagram", type: "url" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const canEdit = useCanEdit();

  return (
    <form action={action} className="space-y-6">
      <fieldset disabled={!canEdit} className="contents">
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="card p-5 sm:p-6">
          <legend className="sr-only">{g.title}</legend>
          <h2 className="mb-4 font-semibold text-slate-900">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                <label className="label" htmlFor={f.key}>
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea id={f.key} name={f.key} rows={3} defaultValue={settings[f.key]} className="input" />
                ) : (
                  <input id={f.key} name={f.key} type={f.type ?? "text"} defaultValue={settings[f.key]} className="input" />
                )}
                {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="card flex items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="font-semibold text-slate-900">Terima permohonan dalam talian</p>
          <p className="text-sm text-slate-500">Papar borang &quot;Jadi ahli&quot; di laman web</p>
        </div>
        <input
          type="checkbox"
          name="joinEnabled"
          defaultChecked={settings.joinEnabled !== "FALSE"}
          className="size-5 accent-brand-600"
        />
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex items-center justify-end gap-4 rounded-2xl bg-white/80 p-3 ring-1 ring-slate-200 backdrop-blur">
          <div className="flex-1">
            <FormMessage state={state} />
          </div>
          <SubmitButton>Simpan tetapan</SubmitButton>
        </div>
      )}
      </fieldset>
    </form>
  );
}
