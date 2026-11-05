// Shared by the Statistik page and its children list, so a chart's count always matches the list it opens.
import { ageFrom, GENDERS, OKU_DETAILS, OKU_TYPES, splitOkuTypes, type Child } from "@/lib/data";

const ALL_DETAILS = Object.values(OKU_DETAILS).flat();

export const AGE_GROUPS = [
  { key: "0-6", label: "0–6 tahun", note: "Prasekolah", min: 0, max: 6 },
  { key: "7-12", label: "7–12 tahun", note: "Sekolah rendah", min: 7, max: 12 },
  { key: "13-17", label: "13–17 tahun", note: "Sekolah menengah", min: 13, max: 17 },
  { key: "18-24", label: "18–24 tahun", note: "Belia", min: 18, max: 24 },
  { key: "25+", label: "25 tahun ke atas", note: "Dewasa", min: 25, max: Infinity },
] as const;

/** Number-of-OKU-types buckets; "2+" is "more than one type". */
export const TYPE_COUNTS = [
  { key: "1", label: "1 jenis", test: (n: number) => n === 1 },
  { key: "2", label: "2 jenis", test: (n: number) => n === 2 },
  { key: "3", label: "3 jenis atau lebih", test: (n: number) => n >= 3 },
  { key: "2+", label: "Lebih daripada satu jenis", test: (n: number) => n >= 2 },
] as const;

export type ChildRow = Child & { types: string[]; details: string[]; age: number | null };

export const toChildRows = (children: Child[], memberIds: Set<string>): ChildRow[] =>
  children
    .filter((c) => memberIds.has(c.memberId)) // ignore leftover rows whose member has been deleted
    .map((c) => ({ ...c, types: splitOkuTypes(c.okuType), details: splitOkuTypes(c.okuDetail ?? ""), age: ageFrom(c.dob) }));

/** Filters taken from the URL (?oku=&butiran=&jantina=&umur=&bilangan=). Unknown values are dropped. */
export type ChildFilters = { oku?: string; butiran?: string; jantina?: string; umur?: string; bilangan?: string };

export function cleanFilters(raw: Record<string, string | string[] | undefined>): ChildFilters {
  const one = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : undefined);
  const f: ChildFilters = {};
  const oku = one("oku");
  if (oku && (OKU_TYPES as readonly string[]).includes(oku)) f.oku = oku;
  const butiran = one("butiran");
  if (butiran && ALL_DETAILS.includes(butiran)) f.butiran = butiran;
  const jantina = one("jantina");
  if (jantina && (GENDERS as readonly string[]).includes(jantina)) f.jantina = jantina;
  const umur = one("umur");
  if (umur && AGE_GROUPS.some((g) => g.key === umur)) f.umur = umur;
  const bilangan = one("bilangan");
  if (bilangan && TYPE_COUNTS.some((t) => t.key === bilangan)) f.bilangan = bilangan;
  return f;
}

export function matches(c: ChildRow, f: ChildFilters) {
  if (f.oku && !c.types.includes(f.oku)) return false;
  if (f.butiran && !c.details.includes(f.butiran)) return false;
  if (f.jantina && c.gender !== f.jantina) return false;
  if (f.umur) {
    const g = AGE_GROUPS.find((x) => x.key === f.umur)!;
    if (c.age === null || c.age < g.min || c.age > g.max) return false;
  }
  if (f.bilangan && !TYPE_COUNTS.find((t) => t.key === f.bilangan)!.test(c.types.length)) return false;
  return true;
}

export const childrenHref = (f: ChildFilters) => {
  const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  return `/admin/statistik/anak${q ? `?${q}` : ""}`;
};
