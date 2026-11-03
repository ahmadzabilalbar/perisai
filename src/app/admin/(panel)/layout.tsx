import { redirect } from "next/navigation";
import { canEdit, getSession } from "@/lib/auth";
import { isSheetsConfigured } from "@/lib/sheets";
import { AdminRoleProvider } from "@/components/AdminRole";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { superadmin: "Super admin", admin: "Admin", viewer: "View only" } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const editable = canEdit(session.role);

  return (
    <AdminRoleProvider canEdit={editable}>
      <div className="min-h-screen bg-slate-50 lg:pl-64">
        <AdminNav
          user={session.email ?? "Admin (password)"}
          role={ROLE_LABEL[session.role]}
          isSuperAdmin={session.role === "superadmin"}
        />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          {!isSheetsConfigured() && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              <strong>Google Sheets is not connected.</strong> Set <code>GOOGLE_SHEET_ID</code>,{" "}
              <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and <code>GOOGLE_PRIVATE_KEY</code> in your environment
              variables. See README.md.
            </div>
          )}
          {!editable && (
            <div className="mb-6 rounded-2xl bg-sky-50 p-4 text-sm text-sky-800 ring-1 ring-sky-200">
              <strong>View-only access.</strong> You can see all admin information but cannot make changes. Ask the
              super admin to upgrade your account if you need to update records.
            </div>
          )}
          {children}
        </main>
      </div>
    </AdminRoleProvider>
  );
}
