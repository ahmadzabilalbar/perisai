"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { requestLoginCode, verifyLoginCodeAction, type CodeState } from "../actions";

/** Two-step email sign-in: email → Kod 6 digit. "Start over" remounts it with fresh state. */
export function EmailLogin() {
  const [round, setRound] = useState(0);
  return <EmailLoginSteps key={round} onRestart={() => setRound((r) => r + 1)} />;
}

function EmailLoginSteps({ onRestart }: { onRestart: () => void }) {
  const [sendState, sendAction] = useActionState(requestLoginCode, undefined);
  const [verifyState, verifyAction] = useActionState(verifyLoginCodeAction, undefined);

  if (sendState?.step !== "code") {
    return (
      <form action={sendAction} className="space-y-3">
        <div>
          <label htmlFor="login-email" className="label">
            Alamat e-mel
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            defaultValue={sendState?.email}
            placeholder="nama@uum.edu.my"
            autoComplete="email"
            className="input"
          />
        </div>
        <Message state={sendState} />
        <SubmitButton className="btn-primary w-full" pendingText="Menghantar kod…">
          Hantar kod log masuk ke e-mel saya
        </SubmitButton>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="space-y-3">
      <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-200">{sendState.info}</p>
      <input type="hidden" name="email" value={sendState.email} />
      <div>
        <label htmlFor="login-code" className="label">
          Kod 6 digit
        </label>
        <input
          id="login-code"
          name="code"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          className="input text-center font-mono !text-xl tracking-[0.5em]"
        />
      </div>
      <Message state={verifyState} />
      <SubmitButton className="btn-primary w-full" pendingText="Menyemak…">
        Log masuk
      </SubmitButton>
      <button type="button" onClick={onRestart} className="w-full text-center text-sm text-slate-500 hover:text-slate-800">
        Guna e-mel lain atau hantar semula kod
      </button>
    </form>
  );
}

function Message({ state }: { state: CodeState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
      {state.error}
    </p>
  );
}
