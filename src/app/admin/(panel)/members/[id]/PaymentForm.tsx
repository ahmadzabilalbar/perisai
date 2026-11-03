"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { today } from "@/lib/format";
import { recordPayment } from "../../../actions";

export function PaymentForm({
  memberId,
  defaultType,
  currency,
  annualFee,
  lifetimeFee,
}: {
  memberId: string;
  defaultType: "Annual" | "Lifetime";
  currency: string;
  annualFee: string;
  lifetimeFee: string;
}) {
  const [state, action] = useActionState(recordPayment, undefined);
  const [type, setType] = useState(defaultType);
  const [years, setYears] = useState(1);

  const suggested = type === "Lifetime" ? lifetimeFee : String((Number(annualFee) || 0) * years);

  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <h2 className="font-semibold text-slate-900">Record payment</h2>
        <p className="text-xs text-slate-500">
          Annual payments extend validity from the current expiry date (or today if expired).
        </p>
      </div>
      <input type="hidden" name="id" value={memberId} />

      <div className="grid grid-cols-2 gap-2">
        {(["Annual", "Lifetime"] as const).map((t) => (
          <label
            key={t}
            className="flex cursor-pointer items-center justify-center rounded-xl py-2 text-sm font-medium ring-1 ring-slate-200 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:checked]:ring-brand-600"
          >
            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
            {t}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {type === "Annual" && (
          <div>
            <label className="label">Years</label>
            <select
              name="years"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="input"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={type === "Lifetime" ? "col-span-2" : ""}>
          <label className="label">Amount ({currency})</label>
          <input key={suggested} name="amount" inputMode="decimal" defaultValue={suggested} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Payment date</label>
        <input name="date" type="date" defaultValue={today()} className="input" />
      </div>
      <div>
        <label className="label">Note</label>
        <input name="note" placeholder="e.g. Bank transfer ref #123" className="input" />
      </div>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Recording…">
        Record payment
      </SubmitButton>
    </form>
  );
}
