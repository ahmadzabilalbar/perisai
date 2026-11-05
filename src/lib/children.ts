import "server-only";
import { appendRows, deleteRows, newId, nowIso, readRows, writeRows, type NumberedRow, type Row } from "./sheets";
import { GENDERS, OKU_DETAILS, OKU_SEPARATOR, OKU_TYPES, today } from "./format";

export type ChildInput = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  okuTypes: string[];
  okuDetails: string[];
};

/**
 * Reads the repeated child fields submitted by <ChildrenFields>.
 * Rows left completely blank are ignored; partly filled rows are an error.
 */
export function parseChildren(fd: FormData): { children: ChildInput[]; error?: string } {
  const col = (k: string) => fd.getAll(k).map((v) => String(v).trim().slice(0, 200));
  const keys = col("childKey");
  const ids = col("childId");
  const names = col("childName");
  const dobs = col("childDob");
  const genders = col("childGender");

  const children: ChildInput[] = [];
  for (let i = 0; i < names.length; i++) {
    // Checkbox groups are named per row, since unchecked boxes submit nothing
    const okuTypes = [...new Set(col(`childOkuType:${keys[i]}`))].filter((t) =>
      (OKU_TYPES as readonly string[]).includes(t),
    );
    // Specific conditions are optional; keep only those belonging to a ticked type
    const allowed = new Set(okuTypes.flatMap((t) => OKU_DETAILS[t as keyof typeof OKU_DETAILS] ?? []));
    const okuDetails = [...new Set(col(`childOkuDetail:${keys[i]}`))].filter((d) => allowed.has(d));
    const c = { id: ids[i] ?? "", name: names[i], dob: dobs[i] ?? "", gender: genders[i] ?? "", okuTypes, okuDetails };
    if (!c.name && !c.dob && !c.gender && !c.okuTypes.length) continue;
    const n = `Anak ${i + 1}`;
    if (!c.name) return { children, error: `${n}: sila masukkan nama anak.` };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.dob) || c.dob > today()) {
      return { children, error: `${n}: sila masukkan tarikh lahir yang sah.` };
    }
    if (!(GENDERS as readonly string[]).includes(c.gender)) return { children, error: `${n}: sila pilih jantina.` };
    if (!c.okuTypes.length) return { children, error: `${n}: sila pilih sekurang-kurangnya satu jenis OKU.` };
    children.push(c);
  }
  return { children };
}

/**
 * Replaces all children of `memberId` with `children` (pass [] to remove them all).
 * Only this member's rows are touched: kept children are updated in place, new ones appended,
 * and removed ones deleted. Other members' rows are never rewritten.
 */
export async function saveChildren(memberId: string, children: ChildInput[]) {
  const existing = new Map(
    (await readRows("Children")).filter((r) => r.row.memberId === memberId).map((r) => [r.row.id, r]),
  );
  const now = nowIso();
  const toWrite: NumberedRow[] = [];
  const toAppend: Row[] = [];

  for (const c of children) {
    const prev = existing.get(c.id);
    const row: Row = {
      id: prev ? c.id : newId(),
      memberId,
      name: c.name,
      dob: c.dob,
      gender: c.gender,
      okuType: c.okuTypes.join(OKU_SEPARATOR),
      okuDetail: c.okuDetails.join(OKU_SEPARATOR),
      createdAt: prev?.row.createdAt || now,
      updatedAt: now,
    };
    if (prev) {
      toWrite.push({ rowNumber: prev.rowNumber, row });
      existing.delete(c.id); // a duplicated id in the form can't claim the same row twice
    } else {
      toAppend.push(row);
    }
  }

  // In-place writes first (row numbers still valid), then appends, then deletions bottom-up
  await writeRows("Children", toWrite);
  await appendRows("Children", toAppend);
  await deleteRows(
    "Children",
    [...existing.values()].map((r) => r.rowNumber),
  );
}
