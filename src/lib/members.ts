import "server-only";
import { insert, readAll, withTableLock, type Row } from "./sheets";

export type MemberConflict = "staffNo" | "email";

/**
 * Adds a member row. Uniqueness checks and the next member no. use a fresh read under the Members lock,
 * so two sign-ups at the same moment can't get the same member no. or register the same staff no. twice.
 * `row.memberNo` is kept if given; otherwise the next free M0001-style number is used.
 */
export function insertMember(
  row: Row,
  { uniqueEmail = false }: { uniqueEmail?: boolean } = {},
): Promise<{ conflict?: MemberConflict; memberNo?: string }> {
  return withTableLock("Members", async () => {
    const rows = await readAll("Members");
    if (rows.some((r) => r.staffNo === row.staffNo)) return { conflict: "staffNo" };
    const email = row.email?.toLowerCase();
    if (uniqueEmail && email && rows.some((r) => r.email.toLowerCase() === email)) return { conflict: "email" };

    const max = rows.reduce((n, r) => Math.max(n, Number(r.memberNo.replace(/\D/g, "")) || 0), 0);
    const memberNo = row.memberNo || `M${String(max + 1).padStart(4, "0")}`;
    await insert("Members", { ...row, memberNo });
    return { memberNo };
  });
}
