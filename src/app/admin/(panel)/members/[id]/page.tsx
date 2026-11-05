import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EditOnly } from "@/components/AdminRole";
import { IconChat } from "@/components/Icons";
import {
  daysUntil,
  FEE_STATUS_LABEL,
  formatDate,
  getMember,
  getMemberChildren,
  getPayments,
  getSettings,
  MEMBERSHIP_LABEL,
  memberState,
  type MembershipType,
  whatsappShareUrl,
} from "@/lib/data";
import { deleteMember, setFeeStatus } from "../../../actions";
import { MemberForm } from "../MemberForm";
import { PaymentForm } from "./PaymentForm";
import { EditLinkCard } from "./EditLinkCard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getMember((await params).id);
  return { title: m?.name ?? "Ahli" };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  const [m, payments, s, childList] = await Promise.all([
    getMember(id),
    getPayments(),
    getSettings(),
    getMemberChildren(id),
  ]);
  if (!m) notFound();

  const state = memberState(m);
  const history = payments.filter((p) => p.memberId === m.id).sort((a, b) => b.date.localeCompare(a.date));
  const days = daysUntil(m.paidUntil);

  // WhatsApp reminder for members whose membership has lapsed or is unpaid
  const needsReminder = state === "Expired" || state === "Unpaid";
  const fee = m.membershipType === "Lifetime" ? s.lifetimeFee : s.annualFee;
  const typeLabel = MEMBERSHIP_LABEL[m.membershipType].toLowerCase();
  const reminder = needsReminder
    ? [
        `Assalamualaikum dan salam sejahtera ${m.name}.`,
        "",
        state === "Expired"
          ? `Ini peringatan mesra daripada ${s.siteName}: keahlian tahunan anda (no. ahli ${m.memberNo}) telah tamat tempoh pada ${formatDate(m.paidUntil)}.`
          : `Ini peringatan mesra daripada ${s.siteName}: yuran keahlian ${typeLabel} anda (no. ahli ${m.memberNo}) masih belum dijelaskan.`,
        ...(fee ? [`Yuran ${typeLabel}: ${s.currency} ${fee}.`] : []),
        ...(s.bankDetails ? ["", "Bayaran boleh dibuat ke:", s.bankDetails.trim()] : []),
        "",
        "Sila maklumkan kepada kami selepas bayaran dibuat. Terima kasih atas sokongan anda.",
      ].join("\n")
    : "";
  const reminderUrl = whatsappShareUrl(reminder);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/members" className="text-sm text-slate-500 hover:text-slate-900">
            ← Ahli
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-2xl font-bold text-slate-900">
            {m.name} <StatusBadge state={state} />
          </h1>
          <p className="font-mono text-sm text-slate-400">
            {m.memberNo}
            {m.staffNo && ` · No. staf UUM ${m.staffNo}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="order-2 lg:order-1">
          <MemberForm key={m.updatedAt} member={m} childList={childList} />
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          {/* Status summary */}
          <div className="card p-5">
            <p className="text-sm text-slate-500">Keahlian {MEMBERSHIP_LABEL[m.membershipType]}</p>
            <p className="mt-1 font-display text-xl font-bold text-slate-900">
              {state === "Lifetime"
                ? "Ahli seumur hidup"
                : state === "Pending"
                  ? "Menunggu bayaran"
                  : m.paidUntil
                    ? days >= 0
                      ? `Sah sehingga ${formatDate(m.paidUntil)}`
                      : `Tamat tempoh ${formatDate(m.paidUntil)}`
                    : "Tiada bayaran aktif"}
            </p>
            {m.membershipType === "Annual" && m.feeStatus === "Paid" && days >= 0 && (
              <p className="mt-1 text-sm text-slate-500">{days} hari lagi</p>
            )}

            <EditOnly>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["Paid", "Unpaid", "Pending"] as const)
                  .filter((st) => st !== m.feeStatus)
                  .map((st) => (
                    <form key={st} action={setFeeStatus.bind(null, m.id, st)}>
                      <button className="btn-secondary !px-3 !py-1.5 !text-xs">Tandakan {FEE_STATUS_LABEL[st].toLowerCase()}</button>
                    </form>
                  ))}
              </div>

              {needsReminder && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <a
                    href={reminderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <IconChat className="size-4" /> Hantar peringatan WhatsApp
                  </a>
                  <p className="mt-2 text-xs text-slate-500">
                    Membuka WhatsApp dengan mesej peringatan yuran yang telah diisi. Pilih penerima, dan sunting
                    mesej jika perlu sebelum menghantar.
                  </p>
                </div>
              )}
            </EditOnly>
          </div>

          <EditOnly>
            <EditLinkCard memberId={m.id} name={m.name} token={m.editToken} />
          </EditOnly>

          <EditOnly>
            <PaymentForm
              memberId={m.id}
              defaultType={m.membershipType}
              currency={s.currency}
              annualFee={s.annualFee}
              lifetimeFee={s.lifetimeFee}
            />
          </EditOnly>

          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Sejarah bayaran</h2>
            {history.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-500">Belum ada bayaran.</p>
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
                      {MEMBERSHIP_LABEL[p.type as MembershipType] ?? p.type}
                      {p.type === "Annual" && p.coverage ? ` · ${p.coverage}` : ""}
                    </p>
                    {p.note && <p className="mt-1 text-xs text-slate-400">{p.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <EditOnly>
            <form action={deleteMember.bind(null, m.id)}>
              <ConfirmButton message={`Padam ${m.name}? Tindakan ini tidak boleh dibatalkan.`} className="btn-ghost w-full !text-rose-600">
                Padam ahli
              </ConfirmButton>
            </form>
          </EditOnly>
        </aside>
      </div>
    </div>
  );
}
