"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { setUserPassword } from "../../actions";

/** Inline "Set password" control for one user row. */
export function SetPasswordButton({ email, label = "Tetapkan kata laluan" }: { email: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(setUserPassword, undefined);

  if (!open || state?.ok) {
    return (
      <span className="inline-flex items-center gap-2">
        {state?.ok && <span className="text-xs text-emerald-600">✓ {state.ok}</span>}
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary !px-3 !py-1.5 !text-xs">
          {label}
        </button>
      </span>
    );
  }

  return (
    <form action={action} className="flex w-full flex-wrap items-start gap-2 sm:w-auto">
      <input type="hidden" name="email" value={email} />
      <input
        name="password"
        type="text"
        required
        minLength={8}
        autoFocus
        autoComplete="new-password"
        placeholder="Kata laluan baharu (min. 8)"
        className="input !w-52 !py-1.5"
      />
      <SubmitButton className="btn-primary !px-3 !py-1.5 !text-xs" pendingText="Menyimpan…">
        Simpan
      </SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-3 !py-1.5 !text-xs">
        Batal
      </button>
      {state?.error && (
        <div className="basis-full">
          <FormMessage state={state} />
        </div>
      )}
    </form>
  );
}
