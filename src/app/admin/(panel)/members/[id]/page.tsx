import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { daysUntil, formatDate, getMember, getPayments, getSettings, memberState } from "@/lib/data";
import { deleteMember, setFeeStatus } from "../../../actions";
import { MemberForm } from "../MemberForm";
import { PaymentForm } from "./PaymentForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getMember((await params).id);
  return { title: m?.name ?? "Member" };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  const [m, payments, s] = await Promise.all([getMember(id), getPayments(), getSettings()]);
  if (!m) notFound();

  const state = memberState(m);
  const history = payments.filter((p) => p.memberId === m.id).sort((a, b) => b.date.localeCompare(a.date));
  const days = daysUntil(m.paidUntil);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/members" className="text-sm text-slate-500 hover:text-slate-900">
            ← Members
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-2xl font-bold text-slate-900">
            {m.name} <StatusBadge state={state} />
          </h1>
          <p className="font-mono text-sm text-slate-400">{m.memberNo}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="order-2 lg:order-1">
          <MemberForm key={m.updatedAt} member={m} />
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          {/* Status summary */}
          <div className="card p-5">
            <p className="text-sm text-slate-500">{m.membershipType} membership</p>
            <p className="mt-1 font-display text-xl font-bold text-slate-900">
              {state === "Lifetime"
                ? "Lifetime member"
                : state === "Pending"
                  ? "Awaiting payment"
                  : m.paidUntil
                    ? days >= 0
                      ? `Valid until ${formatDate(m.paidUntil)}`
                      : `Expired ${formatDate(m.paidUntil)}`
                    : "No active payment"}
            </p>
            {m.membershipType === "Annual" && m.feeStatus === "Paid" && days >= 0 && (
              <p className="mt-1 text-sm text-slate-500">{days} days remaining</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(["Paid", "Unpaid", "Pending"] as const)
                .filter((st) => st !== m.feeStatus)
                .map((st) => (
                  <form key={st} action={setFeeStatus.bind(null, m.id, st)}>
                    <button className="btn-secondary !px-3 !py-1.5 !text-xs">Mark {st.toLowerCase()}</button>
                  </form>
                ))}
            </div>
          </div>

          <PaymentForm
            memberId={m.id}
            defaultType={m.membershipType}
            currency={s.currency}
            annualFee={s.annualFee}
            lifetimeFee={s.lifetimeFee}
          />

          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Payment history</h2>
            {history.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-500">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {history.map((p) => (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-slate-900">{formatDate(p.date)}</span>
                      <span className="font-semibold">
                        {s.currency} {p.amount || "0"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.type}
                      {p.type === "Annual" && p.coverage ? ` · ${p.coverage}` : ""}
                    </p>
                    {p.note && <p className="mt-1 text-xs text-slate-400">{p.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action={deleteMember.bind(null, m.id)}>
            <ConfirmButton message={`Delete ${m.name}? This cannot be undone.`} className="btn-ghost w-full !text-rose-600">
              Delete member
            </ConfirmButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
