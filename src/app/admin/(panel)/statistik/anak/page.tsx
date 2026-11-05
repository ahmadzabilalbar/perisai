import type { Metadata } from "next";
import Link from "next/link";
import { IconX } from "@/components/Icons";
import { PrintButton } from "@/components/PrintButton";
import { formatDate, getChildren, getMembers, OKU_DETAILS, OKU_EXAMPLES } from "@/lib/data";
import {
  AGE_GROUPS,
  childrenHref,
  cleanFilters,
  matches,
  toChildRows,
  TYPE_COUNTS,
  type ChildFilters,
} from "../children-filter";

export const metadata: Metadata = { title: "Senarai anak" };

const printedAt = () =>
  new Date().toLocaleString("ms-MY", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" });

const FILTER_NAME: Record<keyof ChildFilters, string> = {
  oku: "Jenis OKU",
  butiran: "Butiran",
  jantina: "Jantina",
  umur: "Umur",
  bilangan: "Bilangan jenis OKU",
};

function filterValueLabel(key: keyof ChildFilters, value: string) {
  if (key === "umur") return AGE_GROUPS.find((g) => g.key === value)?.label ?? value;
  if (key === "bilangan") return TYPE_COUNTS.find((t) => t.key === value)?.label ?? value;
  return value;
}

export default async function ChildrenList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = cleanFilters(await searchParams);
  const [members, allChildren] = await Promise.all([getMembers(), getChildren()]);
  const parents = new Map(members.map((m) => [m.id, m]));
  const rows = toChildRows(allChildren, new Set(parents.keys()))
    .filter((c) => matches(c, filters))
    .sort((a, b) => a.name.localeCompare(b.name));
  const active = Object.entries(filters) as [keyof ChildFilters, string][];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/statistik" className="text-sm text-slate-500 hover:text-slate-900 print:hidden">
            ← Statistik
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">Senarai anak OKU</h1>
          <p className="text-sm text-slate-500">
            {rows.length} anak
            {active.length > 0 && (
              <span className="hidden print:inline">
                {" "}
                · {active.map(([k, v]) => `${FILTER_NAME[k]}: ${filterValueLabel(k, v)}`).join(" · ")}
              </span>
            )}
          </p>
          <p className="hidden text-xs text-slate-500 print:block">Dijana pada {printedAt()}</p>
        </div>
        <PrintButton />
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {active.map(([k, v]) => {
            const rest = { ...filters };
            delete rest[k];
            return (
              <Link
                key={k}
                href={childrenHref(rest)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                title="Buang penapis ini"
              >
                <span className="opacity-60">{FILTER_NAME[k]}:</span> {filterValueLabel(k, v)}
                <IconX className="size-3.5" />
              </Link>
            );
          })}
          {active.length > 1 && (
            <Link href={childrenHref({})} className="text-sm text-slate-500 hover:text-slate-900 hover:underline">
              Buang semua penapis
            </Link>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-slate-500">Tiada anak yang sepadan dengan penapis ini.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Nama anak</th>
                <th className="px-5 py-3">Umur</th>
                <th className="px-5 py-3">Jantina</th>
                <th className="px-5 py-3">Jenis OKU</th>
                <th className="px-5 py-3">Ibu / bapa (ahli)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => {
                const parent = parents.get(c.memberId)!;
                return (
                  <tr key={c.id} className="break-inside-avoid align-top">
                    <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-700" title={`Lahir ${formatDate(c.dob)}`}>
                      {c.age === null ? "—" : `${c.age} tahun`}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{c.gender || "—"}</td>
                    <td className="px-5 py-3">
                      <ul className="space-y-1.5">
                        {c.types.map((t) => (
                          <li key={t}>
                            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                              {t}
                            </span>
                            <OkuDetail type={t} chosen={c.details} highlight={filters.butiran} />
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/members/${parent.id}`} className="text-brand-700 hover:underline">
                        {parent.name}
                      </Link>
                      <p className="font-mono text-xs text-slate-400">{parent.memberNo}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** The specific conditions ticked for this type, or the type's general examples (grey) if none were ticked. */
function OkuDetail({ type, chosen, highlight }: { type: string; chosen: string[]; highlight?: string }) {
  const options = OKU_DETAILS[type as keyof typeof OKU_DETAILS] ?? [];
  const picked = chosen.filter((d) => options.includes(d));
  if (!picked.length) {
    const examples = OKU_EXAMPLES[type as keyof typeof OKU_EXAMPLES];
    return examples ? <span className="mt-0.5 block text-xs text-slate-400">{examples}</span> : null;
  }
  return (
    <span className="mt-0.5 block text-xs text-slate-700">
      {picked.map((d, i) => (
        <span key={d}>
          {i > 0 && ", "}
          <span className={d === highlight ? "font-semibold text-brand-700" : ""}>{d}</span>
        </span>
      ))}
    </span>
  );
}
