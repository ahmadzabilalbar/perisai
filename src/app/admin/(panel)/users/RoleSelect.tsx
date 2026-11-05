"use client";

import { useTransition } from "react";
import { ROLE_HINT, ROLE_LABEL, USER_ROLES, type UserRole } from "@/lib/format";
import { setUserRole } from "../../actions";

const STYLE: Record<UserRole, string> = {
  admin: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  editor: "bg-amber-50 text-amber-800 ring-amber-600/20",
  viewer: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

/** Changes a user's role as soon as another one is picked. */
export function RoleSelect({ email, role }: { email: string; role: UserRole }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={`Peranan ${email}`}
      value={role}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("role", e.target.value);
        start(() => setUserRole(email, fd));
      }}
      className={`cursor-pointer rounded-full py-0.5 pr-7 pl-2.5 text-xs font-medium ring-1 ring-inset disabled:opacity-60 ${STYLE[role]}`}
    >
      {USER_ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]} · {ROLE_HINT[r]}
        </option>
      ))}
    </select>
  );
}
