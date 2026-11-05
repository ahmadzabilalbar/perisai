"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { login } from "../actions";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="login" className="label">
          E-mel atau nama pengguna
        </label>
        <input
          id="login"
          name="login"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nama@uum.edu.my atau nama pengguna"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Kata laluan
        </label>
        <PasswordInput id="password" name="password" required autoComplete="current-password" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Sedang log masuk…">
        Log masuk
      </SubmitButton>
    </form>
  );
}
