import Link from "next/link";
import { EditOnly } from "@/components/EditOnly";
import { StatusBadge } from "@/components/StatusBadge";
import { IconArrowRight, IconPlus } from "@/components/Icons";
import {
  daysUntil,
  formatDate,
  getMembers,
  getPayments,
  getSettings,
  memberState,
  MEMBERSHIP_LABEL,
  type MembershipType,
} from "@/lib/data";

export default async function Dashboard() {
  const [members, payments, s] = await Promise.all([getMembers(), getPayments(), getSettings()]);
  const withState = members.map((m) => ({ ...m, state: memberState(m) }));
  const count = (st: string) => withState.filter((m) => m.state === st).length;

  const year = new Date().getFullYear().toString();
  const collectedThisYear = payments
    .filter((p) => p.date.startsWith(year))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const stats = [
    { label: "Jumlah ahli", value: members.length, tone: "text-slate-900", href: "/admin/members" },
    {
      label: "Aktif (tahunan)",
      value: count("Active") + count("Expiring"),
      tone: "text-emerald-600",
      href: "/admin/members?status=Active,Expiring",
    },
    { label: "Seumur hidup", value: count("Lifetime"), tone: "text-violet-600", href: "/admin/members?status=Lifetime" },
    {
      label: "Tamat tempoh / belum bayar",
      value: count("Expired") + count("Unpaid"),
      tone: "text-rose-600",
      href: "/admin/members?status=Expired,Unpaid",
    },
    { label: "Permohonan menunggu", value: count("Pending"), tone: "text-sky-600", href: "/admin/members?status=Pending" },
    {
      label: `Kutipan ${year}`,
      value: `${s.currency} ${collectedThisYear.toLocaleString()}`,
      tone: "text-slate-900",
      href: "",
    },
  ];

  const attention = withState
    .filter((m) => ["Pending", "Expiring", "Expired"].includes(m.state))
    .sort((a, b) => (a.paidUntil || "").localeCompare(b.paidUntil || ""))
    .slice(0, 8);

  const recentPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Papan Pemuka</h1>
          <p className="text-sm text-slate-500">Gambaran keseluruhan keahlian</p>
        </div>
        <EditOnly>
          <Link href="/admin/members/new" className="btn-primary">
            <IconPlus className="size-4" /> Tambah ahli
          </Link>
        </EditOnly>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((st) => {
          const body = (
            <>
              <p className="text-sm text-slate-500">{st.label}</p>
              <p className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${st.tone}`}>{st.value}</p>
            </>
          );
          return st.href ? (
            <Link
              key={st.label}
              href={st.href}
              className="card group relative p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
            >
              {body}
              <IconArrowRight className="absolute top-5 right-5 size-4 text-slate-300 transition group-hover:text-brand-600" />
            </Link>
          ) : (
            <div key={st.label} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Perlu perhatian</h2>
            <p className="text-xs text-slate-500">Permohonan menunggu, tamat dalam 30 hari, atau sudah tamat tempoh</p>
          </header>
          {attention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Semuanya baik — tiada yang perlu perhatian 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attention.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/members/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.state === "Pending"
                          ? `Memohon ${formatDate(m.joinDate)}`
                          : m.state === "Expired"
                            ? `Tamat tempoh ${formatDate(m.paidUntil)}`
                            : `Tamat dalam ${daysUntil(m.paidUntil)} hari`}
                      </p>
                    </div>
                    <StatusBadge state={m.state} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Bayaran terkini</h2>
          </header>
          {recentPayments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Belum ada bayaran direkodkan.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.memberName}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(p.date)} · {MEMBERSHIP_LABEL[p.type as MembershipType] ?? p.type}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {s.currency} {p.amount || "0"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
