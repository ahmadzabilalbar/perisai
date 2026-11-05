"use client";

import { useActionState } from "react";
import { useCanEdit } from "@/components/AdminRole";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Settings } from "@/lib/data";
import { REMINDER_PLACEHOLDERS } from "@/lib/format";
import { saveSettings } from "../../actions";

type FieldDef = {
  key: keyof Settings;
  label: string;
  type?: "textarea" | "url" | "email";
  rows?: number;
  hint?: string;
  wide?: boolean;
};

/** A titled block of fields inside a card; `cols` = fields per row on wider screens */
type Section = { subtitle?: string; cols?: 2 | 3; fields: FieldDef[] };
type Group = { id: string; title: string; description: string; sections: Section[]; hint?: React.ReactNode };

const GROUPS: Group[] = [
  {
    id: "umum",
    title: "Umum",
    description: "Nama dan slogan pertubuhan, dipaparkan di pengepala, pengaki dan tab pelayar.",
    sections: [
      {
        fields: [
          { key: "siteName", label: "Nama pertubuhan" },
          { key: "tagline", label: "Slogan" },
        ],
      },
    ],
  },
  {
    id: "laman-utama",
    title: "Laman utama",
    description: "Teks dan gambar di halaman pertama laman web awam.",
    sections: [
      {
        subtitle: "Bahagian utama (hero)",
        fields: [
          { key: "heroTitle", label: "Tajuk", wide: true },
          { key: "heroSubtitle", label: "Subtajuk", type: "textarea", wide: true },
          { key: "heroImage", label: "URL gambar", type: "url", wide: true, hint: "Biarkan kosong untuk memaparkan ilustrasi kad ahli." },
        ],
      },
      {
        subtitle: "Bahagian Tentang Kami",
        fields: [
          { key: "aboutTitle", label: "Tajuk", wide: true },
          { key: "aboutBody", label: "Teks", type: "textarea", wide: true, hint: "Menyokong Markdown." },
        ],
      },
    ],
  },
  {
    id: "yuran",
    title: "Yuran keahlian",
    description: "Kadar yuran dan cara membayar, dipaparkan di laman utama, halaman Sertai dan mesej peringatan.",
    sections: [
      {
        subtitle: "Kadar yuran",
        cols: 3,
        fields: [
          { key: "currency", label: "Mata wang" },
          { key: "annualFee", label: "Yuran tahunan" },
          { key: "lifetimeFee", label: "Yuran seumur hidup" },
          { key: "feeNotes", label: "Catatan yuran", type: "textarea", wide: true },
        ],
      },
      {
        subtitle: "Bayaran",
        fields: [
          {
            key: "bankDetails",
            label: "Maklumat bayaran / bank",
            type: "textarea",
            wide: true,
            hint: "Dipaparkan di halaman Sertai. Menyokong Markdown.",
          },
        ],
      },
    ],
  },
  {
    id: "templat",
    title: "Templat mesej",
    description: "Mesej WhatsApp yang disediakan apabila anda menghantar peringatan kepada ahli.",
    sections: [
      {
        fields: [
          { key: "reminderExpired", label: "Peringatan: keahlian tamat tempoh", type: "textarea", rows: 9, wide: true },
          { key: "reminderUnpaid", label: "Peringatan: yuran belum dibayar", type: "textarea", rows: 9, wide: true },
        ],
      },
    ],
    hint: (
      <>
        Boleh guna: {REMINDER_PLACEHOLDERS.map((p, i) => (
          <span key={p}>
            {i > 0 && ", "}
            <code className="rounded bg-white px-1 ring-1 ring-slate-200">{`{${p}}`}</code>
          </span>
        ))}
        . Perenggan yang menggunakan nilai kosong (contohnya{" "}
        <code className="rounded bg-white px-1 ring-1 ring-slate-200">{"{bank}"}</code> jika tiada maklumat bank) akan
        digugurkan. Biarkan kosong untuk mesej asal.
      </>
    ),
  },
  {
    id: "hubungan",
    title: "Hubungan & media sosial",
    description: "Dipaparkan di pengaki dan laman utama laman web.",
    sections: [
      {
        subtitle: "Hubungan",
        fields: [
          { key: "contactEmail", label: "E-mel", type: "email" },
          { key: "contactPhone", label: "No. telefon" },
          { key: "address", label: "Alamat", type: "textarea", wide: true },
        ],
      },
      {
        subtitle: "Media sosial",
        fields: [
          { key: "facebook", label: "URL Facebook", type: "url" },
          { key: "instagram", label: "URL Instagram", type: "url" },
        ],
      },
    ],
  },
];

const JOIN = { id: "permohonan", title: "Permohonan keahlian" };

/** Card header shared by every section, so they all read the same way */
function GroupHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const canEdit = useCanEdit();

  return (
    <form action={action} className="space-y-6">
      {/* Jump links to each section */}
      <nav aria-label="Bahagian tetapan" className="flex flex-wrap gap-2">
        {[...GROUPS, JOIN].map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:text-slate-900 hover:ring-slate-300"
          >
            {g.title}
          </a>
        ))}
      </nav>

      <fieldset disabled={!canEdit} className="contents">
        {GROUPS.map((g) => (
          <fieldset key={g.id} id={g.id} className="card scroll-mt-6 overflow-hidden">
            <legend className="sr-only">{g.title}</legend>
            <GroupHeader title={g.title} description={g.description} />
            <div className="space-y-6 p-5 sm:p-6">
              {g.hint && <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{g.hint}</p>}
              {g.sections.map((sec, i) => (
                <div key={i} className={i > 0 ? "border-t border-slate-100 pt-6" : ""}>
                  {sec.subtitle && (
                    <h3 className="mb-3 text-xs font-semibold tracking-wide text-brand-700 uppercase">{sec.subtitle}</h3>
                  )}
                  <div className={`grid gap-4 ${sec.cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                    {sec.fields.map((f) => (
                      <div key={f.key} className={f.wide ? "sm:col-span-full" : ""}>
                        <label className="label" htmlFor={f.key}>
                          {f.label}
                        </label>
                        {f.type === "textarea" ? (
                          <textarea id={f.key} name={f.key} rows={f.rows ?? 3} defaultValue={settings[f.key]} className="input" />
                        ) : (
                          <input id={f.key} name={f.key} type={f.type ?? "text"} defaultValue={settings[f.key]} className="input" />
                        )}
                        {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <section id={JOIN.id} className="card scroll-mt-6 overflow-hidden">
          <GroupHeader title={JOIN.title} description="Sama ada orang awam boleh memohon menjadi ahli melalui laman web." />
          <label className="flex cursor-pointer items-center justify-between gap-4 p-5 sm:p-6">
            <span>
              <span className="block font-medium text-slate-900">Terima permohonan dalam talian</span>
              <span className="text-sm text-slate-500">Papar borang &quot;Jadi ahli&quot; di laman web</span>
            </span>
            <input
              type="checkbox"
              name="joinEnabled"
              defaultChecked={settings.joinEnabled !== "FALSE"}
              className="size-5 accent-brand-600"
            />
          </label>
        </section>

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
