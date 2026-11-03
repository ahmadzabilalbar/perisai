"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { IconCheck } from "@/components/Icons";
import { submitJoin } from "./actions";

export function JoinForm({
  defaultPlan,
  currency,
  annualFee,
  lifetimeFee,
}: {
  defaultPlan: string;
  currency: string;
  annualFee: string;
  lifetimeFee: string;
}) {
  const [state, action] = useActionState(submitJoin, undefined);

  if (state?.ok) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <IconCheck className="size-7" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold text-slate-900">Application received!</h2>
        <p className="mt-2 text-slate-600">
          Thank you for applying. We&apos;ll be in touch shortly with payment details to activate your membership.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <fieldset>
        <legend className="label">Membership plan</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: "Annual", price: `${currency} ${annualFee} / year` },
            { v: "Lifetime", price: `${currency} ${lifetimeFee} one-time` },
          ].map((p) => (
            <label
              key={p.v}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 ring-slate-200 transition has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-500"
            >
              <input
                type="radio"
                name="membershipType"
                value={p.v}
                defaultChecked={defaultPlan === p.v}
                className="size-4 accent-brand-600"
              />
              <span>
                <span className="block font-semibold text-slate-900">{p.v}</span>
                <span className="text-sm text-slate-500">{p.price}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Full name *</label>
          <input id="name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="staffNo">UUM staff number *</label>
          <input
            id="staffNo"
            name="staffNo"
            required
            minLength={3}
            maxLength={15}
            pattern="[A-Za-z0-9\-\s]{3,15}"
            title="Your UUM staff number (letters and numbers only)"
            className="input uppercase"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input id="phone" name="phone" type="tel" required className="input" autoComplete="tel" />
        </div>
      </div>

      {/* Honeypot field, hidden from humans */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <FormMessage state={{ error: state?.error }} />
      <SubmitButton className="btn-primary w-full !py-3" pendingText="Submitting…">
        Submit application
      </SubmitButton>
    </form>
  );
}
