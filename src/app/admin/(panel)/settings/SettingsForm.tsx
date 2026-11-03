"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Settings } from "@/lib/data";
import { saveSettings } from "../../actions";

type FieldDef = { key: keyof Settings; label: string; type?: "textarea" | "url" | "email"; hint?: string; wide?: boolean };

const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "General",
    fields: [
      { key: "siteName", label: "Organisation name" },
      { key: "tagline", label: "Tagline" },
    ],
  },
  {
    title: "Homepage",
    fields: [
      { key: "heroTitle", label: "Hero title", wide: true },
      { key: "heroSubtitle", label: "Hero subtitle", type: "textarea", wide: true },
      { key: "heroImage", label: "Hero image URL", type: "url", wide: true, hint: "Leave empty to show the member card illustration." },
      { key: "aboutTitle", label: "About section title", wide: true },
      { key: "aboutBody", label: "About section text", type: "textarea", wide: true, hint: "Markdown supported." },
    ],
  },
  {
    title: "Membership fees",
    fields: [
      { key: "currency", label: "Currency" },
      { key: "annualFee", label: "Annual fee" },
      { key: "lifetimeFee", label: "Lifetime fee" },
      { key: "feeNotes", label: "Fee notes", type: "textarea", wide: true },
      {
        key: "bankDetails",
        label: "Payment / bank details",
        type: "textarea",
        wide: true,
        hint: "Shown on the Join page. Markdown supported.",
      },
    ],
  },
  {
    title: "Contact & social",
    fields: [
      { key: "contactEmail", label: "Email", type: "email" },
      { key: "contactPhone", label: "Phone" },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "facebook", label: "Facebook URL", type: "url" },
      { key: "instagram", label: "Instagram URL", type: "url" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);

  return (
    <form action={action} className="space-y-6">
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
          <p className="font-semibold text-slate-900">Accept online applications</p>
          <p className="text-sm text-slate-500">Show the &quot;Become a member&quot; form on the website</p>
        </div>
        <input
          type="checkbox"
          name="joinEnabled"
          defaultChecked={settings.joinEnabled !== "FALSE"}
          className="size-5 accent-brand-600"
        />
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-4 rounded-2xl bg-white/80 p-3 ring-1 ring-slate-200 backdrop-blur">
        <div className="flex-1">
          <FormMessage state={state} />
        </div>
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}
