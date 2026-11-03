"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { IconDownload, IconSearch } from "@/components/Icons";
import { formatDate, type MemberState } from "@/lib/format";
import type { Member } from "@/lib/data";

type Row = Member & { state: MemberState };

const FILTERS: ("All" | MemberState)[] = ["All", "Active", "Lifetime", "Expiring", "Expired", "Unpaid", "Pending"];

export function MembersTable({ members }: { members: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [type, setType] = useState<"All" | "Annual" | "Lifetime">("All");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: members.length };
    for (const m of members) c[m.state] = (c[m.state] ?? 0) + 1;
    return c;
  }, [members]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter((m) => filter === "All" || m.state === filter)
      .filter((m) => type === "All" || m.membershipType === type)
      .filter(
        (m) =>
          !term ||
          [m.name, m.email, m.phone, m.memberNo, m.staffNo, m.icNo].some((v) => v?.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, q, filter, type]);

  function exportCsv() {
    const cols: (keyof Row)[] = [
      "memberNo",
      "staffNo",
      "name",
      "email",
      "phone",
      "icNo",
      "membershipType",
      "state",
      "paidUntil",
      "lastPaymentDate",
      "lastPaymentAmount",
      "joinDate",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
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
            placeholder="Search name, staff no, email, phone…"
            className="input !pl-9"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input sm:!w-44">
          <option value="All">All types</option>
          <option value="Annual">Annual</option>
          <option value="Lifetime">Lifetime</option>
        </select>
        <button onClick={exportCsv} className="btn-secondary">
          <IconDownload className="size-4" /> Export CSV
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f} <span className="opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-slate-500">No members match your filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Valid until</th>
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
                          {m.staffNo && ` · Staff ${m.staffNo}`}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="block">{m.email || "—"}</span>
                      <span className="block text-xs text-slate-400">{m.phone}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{m.membershipType}</td>
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
                        {m.staffNo && ` · Staff ${m.staffNo}`}
                      </p>
                    </div>
                    <StatusBadge state={m.state} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>{m.membershipType}</span>
                    <span>
                      {m.membershipType === "Lifetime" ? "Lifetime" : `Until ${formatDate(m.paidUntil)}`}
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
