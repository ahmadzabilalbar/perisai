import { requireAdmin } from "@/lib/auth";
import { isSheetsConfigured } from "@/lib/sheets";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {!isSheetsConfigured() && (
          <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <strong>Google Sheets is not connected.</strong> Set <code>GOOGLE_SHEET_ID</code>,{" "}
            <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and <code>GOOGLE_PRIVATE_KEY</code> in your environment
            variables. See README.md.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
