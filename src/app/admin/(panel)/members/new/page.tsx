import type { Metadata } from "next";
import Link from "next/link";
import { MemberForm } from "../MemberForm";

export const metadata: Metadata = { title: "Add member" };

export default function NewMemberPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/members" className="text-sm text-slate-500 hover:text-slate-900">
          ← Members
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">Add member</h1>
      </div>
      <MemberForm />
    </div>
  );
}
