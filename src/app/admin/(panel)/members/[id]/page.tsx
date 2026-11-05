import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EditOnly } from "@/components/EditOnly";
import { IconChat } from "@/components/Icons";
import {
  daysUntil,
  fillTemplate,
  formatDate,
  getMember,
  getMemberChildren,
  getPayments,
  getSettings,
  MEMBERSHIP_LABEL,
  memberState,
  type MembershipType,
  whatsappChatUrl,
  whatsappShareUrl,
  withoutToken,
} from "@/lib/data";
import { deleteMember, deletePayment } from "../../../actions";
import { MemberForm } from "../MemberForm";
import { PaymentForm } from "./PaymentForm";
import { EditLinkCard } from "./EditLinkCard";
import { requireStaff } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireStaff(); // the title is the member's name
  const m = await getMember((await params).id);
  return { title: m?.name ?? "Ahli" };
}

export default async function MemberPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const [m, payments, s, childList] = await Promise.all([
    getMember(id),
    getPayments(),
    getSettings(),
    getMemberChildren(id),
  ]);
  if (!m) notFound();

  const state = memberState(m);
  const own = payments.filter((p) => p.memberId === m.id);
  const latestId = own.at(-1)?.id; // sheet order = order recorded; only this one can be deleted
  const history = [...own].sort((a, b) => b.date.localeCompare(a.date));
  const days = daysUntil(m.paidUntil);

  // WhatsApp reminder for members whose membership has lapsed or is unpaid
  const needsReminder = state === "Expired" || state === "Unpaid";
  const fee = m.membershipType === "Lifetime" ? s.lifetimeFee : s.annualFee;
  const typeLabel = MEMBERSHIP_LABEL[m.membershipType].toLowerCase();
  // Message templates are edited in Tetapan → Templat mesej
  const reminder = needsReminder
    ? fillTemplate(state === "Expired" ? s.reminderExpired : s.reminderUnpaid, {
        nama: m.name,
        no_ahli: m.memberNo,
        jenis: typeLabel,
        yuran: fee ? `${s.currency} ${fee}` : "",
        tarikh_tamat: m.paidUntil ? formatDate(m.paidUntil) : "",
        pertubuhan: s.siteName,
        bank: s.bankDetails,
      })
    : "";
  const reminderUrl = whatsappShareUrl(reminder);
  const reminderChatUrl = whatsappChatUrl(m.phone, reminder); // "" when there's no usable phone number

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
          <MemberForm key={m.updatedAt} member={withoutToken(m)} childList={childList} />
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
              {needsReminder && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <IconChat className="size-4 text-emerald-600" /> Peringatan WhatsApp
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {reminderChatUrl ? (
                      <a
                        href={reminderChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn !px-3 bg-emerald-600 text-sm text-white hover:bg-emerald-700"
                      >
                        Hantar ke ahli
                      </a>
                    ) : (
                      <span
                        aria-disabled="true"
                        title="Tiada no. telefon yang sah"
                        className="btn !px-3 cursor-not-allowed bg-slate-100 text-sm text-slate-400"
                      >
                        Hantar ke ahli
                      </span>
                    )}
                    <a
                      href={reminderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn !px-3 text-sm text-emerald-700 ring-1 ring-emerald-600 hover:bg-emerald-50"
                    >
                      Pilih penerima
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {reminderChatUrl ? (
                      <>
                        <strong>Hantar ke ahli</strong> membuka chat dengan {m.phone}.{" "}
                      </>
                    ) : (
                      <>Tiada no. telefon yang sah untuk ahli ini. </>
                    )}
                    <strong>Pilih penerima</strong> membolehkan anda memilih sendiri penerimanya. Mesej telah diisi;
                    sunting jika perlu sebelum menghantar.
                  </p>
                </div>
              )}
            </EditOnly>
          </div>

          {/* Server-side EditOnly: viewers never receive the token */}
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
                    {p.id === latestId && (
                      <EditOnly>
                        <form action={deletePayment.bind(null, p.id)} className="mt-2">
                          <ConfirmButton
                            message={`Padam bayaran ${formatDate(p.date)} (${s.currency} ${p.amount || "0"})?\n\nStatus dan tarikh sah keahlian akan dikembalikan seperti sebelum bayaran ini direkodkan. Tindakan ini tidak boleh dibatalkan.`}
                            className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                          >
                            Padam bayaran ini
                          </ConfirmButton>
                        </form>
                      </EditOnly>
                    )}
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
