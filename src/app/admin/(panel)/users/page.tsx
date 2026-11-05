import type { Metadata } from "next";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireSuperAdmin, superAdminEmails } from "@/lib/auth";
import { formatDate, getUsers } from "@/lib/data";
import { removeUser, setUserRole } from "../../actions";
import { AddUserForm } from "./AddUserForm";
import { SetPasswordButton } from "./SetPasswordButton";

export const metadata: Metadata = { title: "Pengguna & akses" };

export default async function UsersPage() {
  await requireSuperAdmin();
  const all = await getUsers();
  const supers = superAdminEmails();
  // Super admins may have a row only to hold their password; list them separately
  const users = all.filter((u) => !supers.includes(u.email)).sort((a, b) => a.email.localeCompare(b.email));
  const hasPassword = (email: string) => Boolean(all.find((u) => u.email === email)?.passwordHash);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Pengguna & akses</h1>
        <p className="text-sm text-slate-500">
          Mereka yang boleh log masuk ke ruang pentadbir, dengan e-mel dan kata laluan (atau Google). Pengguna baharu bermula
          dengan akses <strong>lihat sahaja</strong>; naik taraf mereka kepada <strong>Pentadbir</strong> apabila mereka perlu
          membuat perubahan.
        </p>
      </div>

      <AddUserForm />

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Senarai akses</h2>
        <ul className="divide-y divide-slate-100">
          {supers.map((email) => (
            <li key={email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{email}</p>
                <p className="text-xs text-slate-500">
                  Akses penuh, mengurus pengguna · {hasPassword(email) ? "Kata laluan ditetapkan" : "Log masuk Google sahaja"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role="superadmin" />
                <SetPasswordButton email={email} label={hasPassword(email) ? "Tukar kata laluan saya" : "Tetapkan kata laluan saya"} />
              </div>
            </li>
          ))}
          {users.map((u) => (
            <li key={u.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{u.name || u.email}</p>
                <p className="truncate text-xs text-slate-500">
                  {u.name ? `${u.email} · ` : ""}Ditambah {formatDate(u.createdAt)} ·{" "}
                  {u.passwordHash ? `Kata laluan ditetapkan ${formatDate(u.passwordUpdatedAt)}` : "Tiada kata laluan"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={u.role} />
                <form action={setUserRole.bind(null, u.email, u.role === "admin" ? "viewer" : "admin")}>
                  <button className="btn-secondary !px-3 !py-1.5 !text-xs">
                    {u.role === "admin" ? "Tukar kepada pemerhati" : "Naik taraf kepada pentadbir"}
                  </button>
                </form>
                <SetPasswordButton email={u.email} label={u.passwordHash ? "Set semula kata laluan" : "Tetapkan kata laluan"} />
                <form action={removeUser.bind(null, u.email)}>
                  <ConfirmButton
                    message={`Buang ${u.email}? Mereka akan hilang akses serta-merta.`}
                    className="btn-ghost !px-3 !py-1.5 !text-xs !text-rose-600"
                  >
                    Buang
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <p className="border-t border-slate-100 px-5 py-6 text-center text-sm text-slate-500">
            Belum ada pengguna lain. Tambah seseorang di atas.
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
  const label = { superadmin: "Pentadbir utama", admin: "Pentadbir", viewer: "Pemerhati" }[role];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>{label}</span>;
}
