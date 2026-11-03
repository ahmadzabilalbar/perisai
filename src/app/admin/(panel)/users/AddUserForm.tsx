"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { addUser } from "../../actions";

export function AddUserForm() {
  const [state, action] = useActionState(addUser, undefined);
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-semibold text-slate-900">Add user</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="u-email">Email *</label>
          <input id="u-email" name="email" type="email" required placeholder="name@uum.edu.my" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="u-name">Name</label>
          <input id="u-name" name="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="u-password">Password *</label>
          <input
            id="u-password"
            name="password"
            type="text"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min 8 characters"
            className="input"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          They sign in with this email and password, and start with view-only access until you upgrade them.
        </p>
        <SubmitButton pendingText="Adding…">Add user</SubmitButton>
      </div>
    </form>
  );
}
