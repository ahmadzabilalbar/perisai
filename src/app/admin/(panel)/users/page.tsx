import type { Metadata } from "next";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireSuperAdmin, superAdminEmails } from "@/lib/auth";
import { formatDate, getUsers } from "@/lib/data";
import { removeUser, setUserRole } from "../../actions";
import { AddUserForm } from "./AddUserForm";

export const metadata: Metadata = { title: "Users & access" };

export default async function UsersPage() {
  await requireSuperAdmin();
  const users = (await getUsers()).sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Users & access</h1>
        <p className="text-sm text-slate-500">
          People who can sign in to the admin area with their Google account. New users start with{" "}
          <strong>view-only</strong> access; upgrade them to <strong>Admin</strong> when they need to make changes.
        </p>
      </div>

      <AddUserForm />

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Access list</h2>
        <ul className="divide-y divide-slate-100">
          {superAdminEmails().map((email) => (
            <li key={email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{email}</p>
                <p className="text-xs text-slate-500">Full access, manages users</p>
              </div>
              <RoleBadge role="superadmin" />
            </li>
          ))}
          {users.map((u) => (
            <li key={u.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{u.name || u.email}</p>
                <p className="truncate text-xs text-slate-500">
                  {u.name ? `${u.email} · ` : ""}Added {formatDate(u.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={u.role} />
                <form action={setUserRole.bind(null, u.email, u.role === "admin" ? "viewer" : "admin")}>
                  <button className="btn-secondary !px-3 !py-1.5 !text-xs">
                    {u.role === "admin" ? "Change to view only" : "Upgrade to admin"}
                  </button>
                </form>
                <form action={removeUser.bind(null, u.email)}>
                  <ConfirmButton
                    message={`Remove ${u.email}? They will lose access immediately.`}
                    className="btn-ghost !px-3 !py-1.5 !text-xs !text-rose-600"
                  >
                    Remove
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <p className="border-t border-slate-100 px-5 py-6 text-center text-sm text-slate-500">
            No other users yet. Add someone above.
          </p>
        )}
      </section>
    </div>
  );
}

function RoleBadge({ role }: { role: "superadmin" | "admin" | "viewer" }) {
  const style = {
    superadmin: "bg-violet-50 text-violet-700 ring-violet-600/20",
    admin: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    viewer: "bg-sky-50 text-sky-700 ring-sky-600/20",
  }[role];
  const label = { superadmin: "Super admin", admin: "Admin", viewer: "View only" }[role];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>{label}</span>;
}
