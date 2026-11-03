import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { IconPlus } from "@/components/Icons";
import { daysUntil, formatDate, getMembers, getPayments, getSettings, memberState } from "@/lib/data";

export default async function Dashboard() {
  const [members, payments, s] = await Promise.all([getMembers(), getPayments(), getSettings()]);
  const withState = members.map((m) => ({ ...m, state: memberState(m) }));
  const count = (st: string) => withState.filter((m) => m.state === st).length;

  const year = new Date().getFullYear().toString();
  const collectedThisYear = payments
    .filter((p) => p.date.startsWith(year))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const stats = [
    { label: "Total members", value: members.length, tone: "text-slate-900" },
    { label: "Active (annual)", value: count("Active") + count("Expiring"), tone: "text-emerald-600" },
    { label: "Lifetime", value: count("Lifetime"), tone: "text-violet-600" },
    { label: "Expired / unpaid", value: count("Expired") + count("Unpaid"), tone: "text-rose-600" },
    { label: "Pending applications", value: count("Pending"), tone: "text-sky-600" },
    {
      label: `Collected in ${year}`,
      value: `${s.currency} ${collectedThisYear.toLocaleString()}`,
      tone: "text-slate-900",
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
          <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your membership</p>
        </div>
        <Link href="/admin/members/new" className="btn-primary">
          <IconPlus className="size-4" /> Add member
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((st) => (
          <div key={st.label} className="card p-5">
            <p className="text-sm text-slate-500">{st.label}</p>
            <p className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${st.tone}`}>{st.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Needs attention</h2>
            <p className="text-xs text-slate-500">Pending applications, expiring within 30 days, or expired</p>
          </header>
          {attention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">All good — nothing needs attention 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attention.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/members/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.state === "Pending"
                          ? `Applied ${formatDate(m.joinDate)}`
                          : m.state === "Expired"
                            ? `Expired ${formatDate(m.paidUntil)}`
                            : `Expires in ${daysUntil(m.paidUntil)} days`}
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
            <h2 className="font-semibold text-slate-900">Recent payments</h2>
          </header>
          {recentPayments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.memberName}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(p.date)} · {p.type}
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
