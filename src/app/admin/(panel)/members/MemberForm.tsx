"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Member } from "@/lib/data";
import { saveMember } from "../../actions";

export function MemberForm({ member }: { member?: Member }) {
  const [state, action] = useActionState(saveMember, undefined);
  const [type, setType] = useState(member?.membershipType ?? "Annual");

  return (
    <form action={action} className="card space-y-6 p-5 sm:p-6">
      {member && <input type="hidden" name="id" value={member.id} />}

      <Section title="Personal details">
        <Field label="Full name *" className="sm:col-span-2">
          <input name="name" required defaultValue={member?.name} className="input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={member?.email} className="input" />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" defaultValue={member?.phone} className="input" />
        </Field>
        <Field label="IC / ID number">
          <input name="icNo" defaultValue={member?.icNo} className="input" />
        </Field>
        <Field label="Member no.">
          <input
            name="memberNo"
            defaultValue={member?.memberNo}
            placeholder="Auto-generated"
            disabled={!!member}
            className="input disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <textarea name="address" rows={2} defaultValue={member?.address} className="input" />
        </Field>
      </Section>

      <Section title="Membership & fees">
        <Field label="Membership type">
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
                {t}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Fee status">
          <select name="feeStatus" defaultValue={member?.feeStatus ?? "Unpaid"} className="input">
            <option>Paid</option>
            <option>Unpaid</option>
            <option>Pending</option>
          </select>
        </Field>
        {type === "Annual" && (
          <Field label="Paid until">
            <input name="paidUntil" type="date" defaultValue={member?.paidUntil} className="input" />
          </Field>
        )}
        <Field label="Join date">
          <input name="joinDate" type="date" defaultValue={member?.joinDate} className="input" />
        </Field>
        <Field label="Last payment date">
          <input name="lastPaymentDate" type="date" defaultValue={member?.lastPaymentDate} className="input" />
        </Field>
        <Field label="Last payment amount">
          <input
            name="lastPaymentAmount"
            inputMode="decimal"
            defaultValue={member?.lastPaymentAmount}
            className="input"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea name="notes" rows={3} defaultValue={member?.notes} className="input" />
        </Field>
      </Section>

      <FormMessage state={state} />
      <div className="flex justify-end gap-3">
        <SubmitButton>{member ? "Save changes" : "Add member"}</SubmitButton>
      </div>
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
