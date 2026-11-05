import type { Metadata } from "next";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireSuperAdmin, superAdminEmails } from "@/lib/auth";
import { formatDate, getUsers } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/format";
import { removeUser } from "../../actions";
import { AddUserForm } from "./AddUserForm";
import { RoleSelect } from "./RoleSelect";
import { SetPasswordButton } from "./SetPasswordButton";
import { SetUsernameButton } from "./SetUsernameButton";

export const metadata: Metadata = { title: "Pengguna & akses" };

export default async function UsersPage() {
  await requireSuperAdmin();
  const all = await getUsers();
  const supers = superAdminEmails();
  // Super admins may have a row only to hold their password; list them separately
  const users = all.filter((u) => !supers.includes(u.email)).sort((a, b) => a.email.localeCompare(b.email));
  const row = (email: string) => all.find((u) => u.email === email);
  const hasPassword = (email: string) => Boolean(row(email)?.passwordHash);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Pengguna & akses</h1>
        <p className="text-sm text-slate-500">
          Mereka yang boleh log masuk ke ruang pentadbir, dengan e-mel atau nama pengguna dan kata laluan (atau Google). Pengguna baharu bermula
          dengan akses <strong>lihat sahaja</strong>; naik taraf mereka kepada <strong>Pentadbir</strong> apabila mereka perlu
          membuat perubahan, atau <strong>Penyunting</strong> jika mereka hanya menulis halaman dan berita (tanpa akses kepada
          data ahli).
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
                  {row(email)?.username ? ` · Nama pengguna: ${row(email)!.username}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role="superadmin" />
                <SetPasswordButton email={email} label={hasPassword(email) ? "Tukar kata laluan saya" : "Tetapkan kata laluan saya"} />
                {/* A username only works with a password, and the password is what creates their row */}
                {row(email) && <SetUsernameButton email={email} username={row(email)!.username} />}
              </div>
            </li>
          ))}
          {users.map((u) => (
            <li key={u.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{u.name || u.email}</p>
                <p className="truncate text-xs text-slate-500">
                  {u.name ? `${u.email} · ` : ""}
                  {u.username ? `Nama pengguna: ${u.username} · ` : ""}Ditambah {formatDate(u.createdAt)} ·{" "}
                  {u.passwordHash ? `Kata laluan ditetapkan ${formatDate(u.passwordUpdatedAt)}` : "Tiada kata laluan"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleSelect email={u.email} role={u.role} />
                <SetPasswordButton email={u.email} label={u.passwordHash ? "Set semula kata laluan" : "Tetapkan kata laluan"} />
                <SetUsernameButton email={u.email} username={u.username} />
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

function RoleBadge({ role }: { role: "superadmin" }) {
  return (
    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-600/20 ring-inset">
      {ROLE_LABEL[role]}
    </span>
  );
}
