import type { Metadata } from "next";
import Link from "next/link";
import { EditOnly } from "@/components/EditOnly";
import { IconPlus } from "@/components/Icons";
import { getChildren, getMembers, memberState, splitOkuTypes, withoutToken, type MemberState } from "@/lib/data";
import { MembersTable, type ChildFilter, type TypeFilter } from "./MembersTable";

export const metadata: Metadata = { title: "Ahli" };

const STATES: MemberState[] = ["Active", "Lifetime", "Expiring", "Expired", "Unpaid", "Pending"];

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; anak?: string | string[]; jenis?: string | string[] }> }) {
  // ?status=Active,Expiring pre-filters the list (used by the dashboard figures)
  // ?anak=tiada / ?anak=ada filters by whether children are registered (used by Statistik)
  const { status, anak, jenis } = await searchParams;
  const initialType: TypeFilter = jenis === "Annual" || jenis === "Lifetime" ? jenis : "All";
  const initialChildren: ChildFilter = anak === "tiada" ? "None" : anak === "ada" ? "Some" : "All";
  const initialStates = String(status ?? "")
    .split(",")
    .filter((s): s is MemberState => (STATES as string[]).includes(s));
  const [all, children] = await Promise.all([getMembers(), getChildren()]);
  const members = all.map((m) => {
    const mine = children.filter((c) => c.memberId === m.id);
    return {
      ...withoutToken(m), // this list goes to a client component: never include update-link tokens
      state: memberState(m),
      childCount: mine.length,
      childNames: mine.map((c) => c.name).join(", "),
      okuTypes: [...new Set(mine.flatMap((c) => splitOkuTypes(c.okuType)))].join(", "),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Ahli</h1>
          <p className="text-sm text-slate-500">Jumlah: {members.length}</p>
        </div>
        <EditOnly>
          <Link href="/admin/members/new" className="btn-primary">
            <IconPlus className="size-4" /> Tambah ahli
          </Link>
        </EditOnly>
      </div>
      <MembersTable
        key={`${initialStates.join()}|${initialChildren}|${initialType}`}
        members={members}
        initialStates={initialStates}
        initialChildren={initialChildren}
        initialType={initialType}
      />
    </div>
  );
}
