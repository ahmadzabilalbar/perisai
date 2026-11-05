"use client";

import { useRef, useState } from "react";
import { IconPlus, IconX } from "@/components/Icons";
import { GENDERS, MAX_CHILDREN, OKU_DETAILS, OKU_EXAMPLES, OKU_TYPES, splitOkuTypes, today } from "@/lib/format";

type ChildValue = { id?: string; name?: string; dob?: string; gender?: string; okuType?: string; okuDetail?: string };

/**
 * Repeatable child rows for a form. Each row submits childKey / childId / childName / childDob /
 * childGender plus `childOkuType:<key>` and `childOkuDetail:<key>` checkboxes, read on the server with parseChildren().
 */
export function ChildrenFields({ initial = [], required = false }: { initial?: ChildValue[]; required?: boolean }) {
  // Keys must be identical on server and client render, so use a simple counter
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : required ? [{}] : []).map((c, i) => ({ key: `c${i}`, ...c })),
  );
  const nextKey = useRef(rows.length);
  const add = () => setRows((r) => [...r, { key: `c${nextKey.current++}` }]);
  const removeRow = (key: string) => setRows((r) => r.filter((c) => c.key !== key));

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-slate-500">Tiada anak didaftarkan.</p>}
      {rows.map((c, i) => (
        <div key={c.key} className="rounded-xl p-4 ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Anak {i + 1}</span>
            {(!required || rows.length > 1) && (
              <button
                type="button"
                onClick={() => removeRow(c.key)}
                className="btn-ghost !px-2 !py-1 !text-xs !text-rose-600"
                aria-label={`Buang anak ${i + 1}`}
              >
                <IconX className="size-3.5" /> Buang
              </button>
            )}
          </div>
          <input type="hidden" name="childKey" value={c.key} />
          <input type="hidden" name="childId" value={c.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor={`childName-${c.key}`}>Nama penuh anak *</label>
              <input id={`childName-${c.key}`} name="childName" required defaultValue={c.name} className="input" />
            </div>
            <div>
              <label className="label" htmlFor={`childDob-${c.key}`}>Tarikh lahir *</label>
              <input
                id={`childDob-${c.key}`}
                name="childDob"
                type="date"
                required
                max={today()}
                defaultValue={c.dob}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor={`childGender-${c.key}`}>Jantina *</label>
              <select id={`childGender-${c.key}`} name="childGender" required defaultValue={c.gender ?? ""} className="input">
                <option value="" disabled>Pilih…</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Jenis OKU * <span className="font-normal text-slate-500">(tandakan semua yang berkenaan)</span></legend>
              <OkuPicker rowKey={c.key} initialTypes={c.okuType} initialDetails={c.okuDetail} />
            </fieldset>
          </div>
        </div>
      ))}
      {rows.length < MAX_CHILDREN ? (
        <button
          type="button"
          onClick={add}
          className="btn w-full border-2 border-dashed border-brand-400 bg-brand-50 py-3 font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-100"
        >
          <IconPlus className="size-5" /> {rows.length ? "Tambah anak lain" : "Tambah anak"}
        </button>
      ) : (
        <p className="text-center text-sm text-slate-500">Maksimum {MAX_CHILDREN} anak.</p>
      )}
    </div>
  );
}

/**
 * OKU type checkboxes. Ticking a type reveals its specific conditions (optional, several allowed).
 * Unticking a type removes its condition checkboxes, so they are not submitted.
 */
function OkuPicker({
  rowKey,
  initialTypes = "",
  initialDetails = "",
}: {
  rowKey: string;
  initialTypes?: string;
  initialDetails?: string;
}) {
  const [types, setTypes] = useState(() => new Set(splitOkuTypes(initialTypes)));
  const details = splitOkuTypes(initialDetails);
  const toggle = (t: string, on: boolean) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (on) next.add(t);
      else next.delete(t);
      return next;
    });

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {OKU_TYPES.map((t) => {
        const on = types.has(t);
        return (
          <div
            key={t}
            className={`rounded-lg text-sm ring-1 ${on ? "bg-brand-50 ring-brand-500" : "ring-slate-200"}`}
          >
            <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2">
              <input
                type="checkbox"
                name={`childOkuType:${rowKey}`}
                value={t}
                checked={on}
                onChange={(e) => toggle(t, e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand-600"
              />
              <span>
                <span className="block font-medium text-slate-900">{t}</span>
                <span className="block text-xs text-slate-500">{OKU_EXAMPLES[t]}</span>
              </span>
            </label>
            {on && (
              <div className="border-t border-brand-200 px-3 pt-2 pb-2.5 pl-9">
                <p className="mb-1.5 text-xs text-slate-500">Nyatakan (pilihan):</p>
                <div className="flex flex-wrap gap-1.5">
                  {OKU_DETAILS[t].map((d) => (
                    <label
                      key={d}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:checked]:ring-brand-600"
                    >
                      <input
                        type="checkbox"
                        name={`childOkuDetail:${rowKey}`}
                        value={d}
                        defaultChecked={details.includes(d)}
                        className="size-3.5 accent-white"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
