"use client";

import { useActionState, useState } from "react";
import { useCanEdit } from "@/components/AdminRole";
import { ChildrenFields } from "@/components/ChildrenFields";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { FEE_STATUS_LABEL, MEMBERSHIP_LABEL, addYears } from "@/lib/format";
import type { Child, Member } from "@/lib/data";
import { saveMember } from "../../actions";

export function MemberForm({ member, childList = [] }: { member?: Member; childList?: Child[] }) {
  const [state, action] = useActionState(saveMember, undefined);
  const canEdit = useCanEdit();
  const [type, setType] = useState(member?.membershipType ?? "Annual");
  // Payment fields are set by "Rekod bayaran" once a member exists; only editable when adding a member
  const dateCls = "input read-only:bg-slate-50 read-only:text-slate-500";
  const [lastPaid, setLastPaid] = useState(member?.lastPaymentDate ?? "");
  // New members: validity is calculated from the payment date (the server does the same)
  const paidUntil = member ? member.paidUntil : lastPaid && addYears(lastPaid, 1);

  return (
    <form action={action} className="card space-y-6 p-5 sm:p-6">
      <fieldset disabled={!canEdit} className="contents">
      {member && <input type="hidden" name="id" value={member.id} />}

      <Section title="Maklumat peribadi">
        <Field label="Nama penuh *">
          <input name="name" required defaultValue={member?.name} className="input" />
        </Field>
        <Field label="No. staf UUM *">
          <input
            name="staffNo"
            required
            inputMode="numeric"
            minLength={4}
            maxLength={5}
            pattern="\d{4,5}"
            title="No. staf UUM (4 atau 5 digit)"
            defaultValue={member?.staffNo}
            className="input font-mono tracking-widest"
          />
        </Field>
        <Field label="E-mel">
          <input name="email" type="email" defaultValue={member?.email} className="input" />
        </Field>
        <Field label="No. telefon">
          <input name="phone" type="tel" defaultValue={member?.phone} className="input" />
        </Field>
        <Field label="No. ahli">
          <input
            name="memberNo"
            defaultValue={member?.memberNo}
            placeholder="Dijana automatik"
            disabled={!!member}
            className="input disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <textarea name="address" rows={2} defaultValue={member?.address} className="input" />
        </Field>
      </Section>

      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-slate-900">Anak (OKU)</legend>
        <ChildrenFields initial={childList} />
      </fieldset>

      <Section title="Keahlian & yuran">
        <Field label="Jenis keahlian">
          <div className="grid grid-cols-2 gap-2">
            {(["Annual", "Lifetime"] as const).map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center justify-center rounded-xl py-2.5 text-sm font-medium ring-1 ring-slate-200 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:checked]:ring-brand-600"
              >
                <input
                  type="radio"
                  name="membershipType"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="sr-only"
                />
                {MEMBERSHIP_LABEL[t]}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Status yuran">
          <select name="feeStatus" defaultValue={member?.feeStatus ?? "Unpaid"} className="input">
            <option value="Paid">{FEE_STATUS_LABEL.Paid}</option>
            <option value="Unpaid">{FEE_STATUS_LABEL.Unpaid}</option>
            <option value="Pending">{FEE_STATUS_LABEL.Pending}</option>
          </select>
        </Field>
        {type === "Annual" && (
          <Field label="Sah sehingga">
            <input name="paidUntil" type="date" value={paidUntil} readOnly className={dateCls} />
            {!member && <p className="mt-1 text-xs text-slate-500">Dikira automatik: tarikh bayaran + 1 tahun.</p>}
          </Field>
        )}
        <Field label="Tarikh sertai">
          <input name="joinDate" type="date" defaultValue={member?.joinDate} className="input" />
        </Field>
        <Field label="Tarikh bayaran terakhir">
          <input
            name="lastPaymentDate"
            type="date"
            value={lastPaid}
            onChange={(e) => setLastPaid(e.target.value)}
            readOnly={!!member}
            className={dateCls}
          />
        </Field>
        <Field label="Jumlah bayaran terakhir">
          <input
            name="lastPaymentAmount"
            inputMode="decimal"
            defaultValue={member?.lastPaymentAmount}
            readOnly={!!member}
            className={dateCls}
          />
        </Field>
        {member && (
          <p className="-mt-1 text-xs text-slate-500 sm:col-span-2">
            Tarikh sah dan bayaran dikemas kini secara automatik melalui <strong>Rekod bayaran</strong>. Gunakan
            borang itu untuk setiap bayaran baharu.
          </p>
        )}
        <Field label="Catatan" className="sm:col-span-2">
          <textarea name="notes" rows={3} defaultValue={member?.notes} className="input" />
        </Field>
      </Section>

      <FormMessage state={state} />
      <div className="flex justify-end gap-3">
        {canEdit && <SubmitButton>{member ? "Simpan perubahan" : "Tambah ahli"}</SubmitButton>}
      </div>
      </fieldset>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
