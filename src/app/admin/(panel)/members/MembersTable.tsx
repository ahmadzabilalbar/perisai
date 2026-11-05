"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { IconDownload, IconSearch } from "@/components/Icons";
import { formatDate, MEMBERSHIP_LABEL, STATE_LABEL, type MemberState } from "@/lib/format";
import type { MemberView } from "@/lib/data";

type Row = MemberView & { state: MemberState; childCount: number; childNames: string; okuTypes: string };

const FILTERS: ("All" | MemberState)[] = ["All", "Active", "Lifetime", "Expiring", "Expired", "Unpaid", "Pending"];

export type ChildFilter = "All" | "Some" | "None";
export type TypeFilter = "All" | "Annual" | "Lifetime";

/** `initialStates` / `initialChildren` pre-select filters (e.g. from a dashboard or statistics link). */
export function MembersTable({
  members,
  initialStates = [],
  initialChildren = "All",
  initialType = "All",
}: {
  members: Row[];
  initialStates?: MemberState[];
  initialChildren?: ChildFilter;
  initialType?: TypeFilter;
}) {
  const [q, setQ] = useState("");
  // Several states can be selected at once (dashboard figures combine e.g. Active + Expiring)
  const [filter, setFilter] = useState<MemberState[]>(initialStates);
  const [type, setType] = useState<TypeFilter>(initialType);
  const [kids, setKids] = useState<ChildFilter>(initialChildren);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: members.length };
    for (const m of members) c[m.state] = (c[m.state] ?? 0) + 1;
    return c;
  }, [members]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter((m) => !filter.length || filter.includes(m.state))
      .filter((m) => type === "All" || m.membershipType === type)
      .filter((m) => kids === "All" || (kids === "None" ? m.childCount === 0 : m.childCount > 0))
      .filter(
        (m) =>
          !term ||
          [m.name, m.email, m.phone, m.memberNo, m.staffNo, m.childNames].some((v) => v?.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, q, filter, type, kids]);

  function exportCsv() {
    const cols: (keyof Row)[] = [
      "memberNo",
      "staffNo",
      "name",
      "email",
      "phone",
      "membershipType",
      "state",
      "paidUntil",
      "lastPaymentDate",
      "lastPaymentAmount",
      "joinDate",
      "childCount",
      "childNames",
      "okuTypes",
    ];
    // Prefix values that spreadsheet apps would run as formulas (names come from the public join form)
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
    };
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `members-${Date.now()}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, no. staf, e-mel, telefon…"
            className="input !pl-9"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input sm:!w-44">
          <option value="All">Semua jenis</option>
          <option value="Annual">{MEMBERSHIP_LABEL.Annual}</option>
          <option value="Lifetime">{MEMBERSHIP_LABEL.Lifetime}</option>
        </select>
        <select value={kids} onChange={(e) => setKids(e.target.value as ChildFilter)} className="input sm:!w-48">
          <option value="All">Semua (anak)</option>
          <option value="Some">Sudah daftar anak</option>
          <option value="None">Belum daftar anak</option>
        </select>
        <button onClick={exportCsv} className="btn-secondary">
          <IconDownload className="size-4" /> Eksport CSV
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f === "All" ? [] : [f])}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              (f === "All" ? !filter.length : filter.includes(f)) ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "All" ? "Semua" : STATE_LABEL[f]} <span className="opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-slate-500">Tiada ahli yang sepadan dengan penapis anda.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Ahli</th>
                  <th className="px-5 py-3">Hubungan</th>
                  <th className="px-5 py-3">Anak</th>
                  <th className="px-5 py-3">Jenis</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sah sehingga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => (
                  <tr key={m.id} className="group cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/members/${m.id}`} className="block">
                        <span className="font-medium text-slate-900 group-hover:text-brand-700">{m.name}</span>
                        <span className="block font-mono text-xs text-slate-400">
                          {m.memberNo}
                          {m.staffNo && ` · Staf ${m.staffNo}`}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="block">{m.email || "—"}</span>
                      <span className="block text-xs text-slate-400">{m.phone}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {m.childCount || <span className="text-amber-600">Tiada</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{MEMBERSHIP_LABEL[m.membershipType]}</td>
                    <td className="px-5 py-3">
                      <StatusBadge state={m.state} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {m.membershipType === "Lifetime" ? "∞" : formatDate(m.paidUntil)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/members/${m.id}`} className="card block p-4 active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{m.name}</p>
                      <p className="font-mono text-xs text-slate-400">
                        {m.memberNo}
                        {m.staffNo && ` · Staf ${m.staffNo}`}
                      </p>
                    </div>
                    <StatusBadge state={m.state} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>
                      {MEMBERSHIP_LABEL[m.membershipType]} · {m.childCount} anak
                    </span>
                    <span>
                      {m.membershipType === "Lifetime" ? MEMBERSHIP_LABEL.Lifetime : `Sehingga ${formatDate(m.paidUntil)}`}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
