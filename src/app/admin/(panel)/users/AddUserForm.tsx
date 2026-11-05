"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { addUser } from "../../actions";

export function AddUserForm() {
  const [state, action] = useActionState(addUser, undefined);
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-semibold text-slate-900">Tambah pengguna</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="u-email">E-mel *</label>
          <input id="u-email" name="email" type="email" required placeholder="nama@uum.edu.my" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="u-name">Nama</label>
          <input id="u-name" name="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="u-password">Kata laluan *</label>
          <input
            id="u-password"
            name="password"
            type="text"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 aksara"
            className="input"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Mereka log masuk dengan e-mel dan kata laluan ini, dan bermula dengan akses lihat sahaja sehingga anda menaik taraf mereka.
        </p>
        <SubmitButton pendingText="Menambah…">Tambah pengguna</SubmitButton>
      </div>
    </form>
  );
}
