import type { MemberState } from "@/lib/format";

const STYLES: Record<MemberState, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Lifetime: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Expiring: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Unpaid: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Pending: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

const DOT: Record<MemberState, string> = {
  Active: "bg-emerald-500",
  Lifetime: "bg-violet-500",
  Expiring: "bg-amber-500",
  Expired: "bg-rose-500",
  Unpaid: "bg-slate-400",
  Pending: "bg-sky-500",
};

export function StatusBadge({ state }: { state: MemberState }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[state]}`}
    >
      <span className={`size-1.5 rounded-full ${DOT[state]}`} />
      {state}
    </span>
  );
}
