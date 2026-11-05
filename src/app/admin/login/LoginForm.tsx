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
        <label htmlFor="email" className="label">
          E-mel
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="nama@uum.edu.my"
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
