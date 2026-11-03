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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="u-email">Google / Gmail address *</label>
          <input id="u-email" name="email" type="email" required placeholder="name@gmail.com" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="u-name">Name</label>
          <input id="u-name" name="name" className="input" />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">They will get view-only access until you upgrade them.</p>
        <SubmitButton pendingText="Adding…">Add user</SubmitButton>
      </div>
    </form>
  );
}
