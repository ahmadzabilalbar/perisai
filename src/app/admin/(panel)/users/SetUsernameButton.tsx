"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { setUsername } from "../../actions";

/** Inline "Set username" control for one user row. Saving an empty box removes the username. */
export function SetUsernameButton({ email, username }: { email: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(setUsername, undefined);

  if (!open || state?.ok) {
    return (
      <span className="inline-flex items-center gap-2">
        {state?.ok && <span className="text-xs text-emerald-600">✓ {state.ok}</span>}
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary !px-3 !py-1.5 !text-xs">
          {username ? "Tukar nama pengguna" : "Tetapkan nama pengguna"}
        </button>
      </span>
    );
  }

  return (
    <form action={action} className="flex w-full flex-wrap items-start gap-2 sm:w-auto">
      <input type="hidden" name="email" value={email} />
      <input
        name="username"
        defaultValue={username}
        autoFocus
        autoCapitalize="none"
        spellCheck={false}
        pattern="[a-zA-Z0-9._\-]{3,30}"
        title="3–30 aksara: huruf, nombor, titik, sengkang atau garis bawah. Kosongkan untuk membuang."
        placeholder="Nama pengguna (kosong = buang)"
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
