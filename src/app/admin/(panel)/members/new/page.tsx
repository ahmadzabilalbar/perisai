import type { Metadata } from "next";
import Link from "next/link";
import { requireEditorPage } from "@/lib/auth";
import { MemberForm } from "../MemberForm";

export const metadata: Metadata = { title: "Tambah ahli" };

export default async function NewMemberPage() {
  await requireEditorPage();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/members" className="text-sm text-slate-500 hover:text-slate-900">
          ← Ahli
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">Tambah ahli</h1>
      </div>
      <MemberForm />
    </div>
  );
}
