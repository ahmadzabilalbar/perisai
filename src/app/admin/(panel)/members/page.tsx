import type { Metadata } from "next";
import Link from "next/link";
import { EditOnly } from "@/components/AdminRole";
import { IconPlus } from "@/components/Icons";
import { getMembers, memberState } from "@/lib/data";
import { MembersTable } from "./MembersTable";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const members = (await getMembers()).map((m) => ({ ...m, state: memberState(m) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500">{members.length} total</p>
        </div>
        <EditOnly>
          <Link href="/admin/members/new" className="btn-primary">
            <IconPlus className="size-4" /> Add member
          </Link>
        </EditOnly>
      </div>
      <MembersTable members={members} />
    </div>
  );
}
