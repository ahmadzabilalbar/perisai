import { redirect } from "next/navigation";
import { canEdit, getSession } from "@/lib/auth";
import { isSheetsConfigured } from "@/lib/sheets";
import { AdminRoleProvider } from "@/components/AdminRole";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { superadmin: "Pentadbir utama", admin: "Pentadbir", viewer: "Pemerhati" } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const editable = canEdit(session.role);

  return (
    <AdminRoleProvider canEdit={editable}>
      <div className="min-h-screen bg-slate-50 lg:pl-64 print:bg-white print:pl-0">
        <AdminNav
          user={session.email}
          role={ROLE_LABEL[session.role]}
          isSuperAdmin={session.role === "superadmin"}
        />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10 print:max-w-none print:p-0">
          {!isSheetsConfigured() && (
            <div className="mb-6 rounded-2xl bg-amber-50 print:hidden p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              <strong>Google Sheets belum disambungkan.</strong> Tetapkan <code>GOOGLE_SHEET_ID</code>,{" "}
              <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> dan <code>GOOGLE_PRIVATE_KEY</code> dalam pemboleh ubah
              persekitaran. Rujuk README.md.
            </div>
          )}
          {!editable && (
            <div className="mb-6 rounded-2xl bg-sky-50 print:hidden p-4 text-sm text-sky-800 ring-1 ring-sky-200">
              <strong>Akses lihat sahaja.</strong> Anda boleh melihat semua maklumat pentadbir tetapi tidak boleh membuat
              perubahan. Minta pentadbir utama menaik taraf akaun anda jika anda perlu mengemas kini rekod.
            </div>
          )}
          {children}
        </main>
      </div>
    </AdminRoleProvider>
  );
}
