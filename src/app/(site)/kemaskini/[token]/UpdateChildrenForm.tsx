"use client";

import { useActionState } from "react";
import { ChildrenFields } from "@/components/ChildrenFields";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Child } from "@/lib/data";
import { updateMyChildren } from "./actions";

export function UpdateChildrenForm({ token, childList }: { token: string; childList: Child[] }) {
  const [state, action] = useActionState(updateMyChildren.bind(null, token), undefined);

  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <ChildrenFields initial={childList} required />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full !py-3">Simpan maklumat anak</SubmitButton>
    </form>
  );
}
