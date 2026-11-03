// Pure helpers that are safe to use in both server and client components.

export type MembershipType = "Annual" | "Lifetime";
export type FeeStatus = "Paid" | "Unpaid" | "Pending";
export type MemberState = "Active" | "Lifetime" | "Expiring" | "Expired" | "Unpaid" | "Pending";

/** UUM staff numbers are 4 digits today; 5 allowed for future numbers. Returns "" if invalid. */
export function normalizeStaffNo(input: string) {
  const v = input.replace(/\s+/g, "");
  return /^\d{4,5}$/.test(v) ? v : "";
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Date `years` after `date`, minus one day (membership valid up to the day before the anniversary). */
export function addYears(date: string, years: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function nextDay(date: string) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(date: string) {
  if (!date) return -Infinity;
  const ms = new Date(date + "T00:00:00Z").getTime() - new Date(today() + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

export function memberState(m: { membershipType: string; feeStatus: string; paidUntil: string }): MemberState {
  if (m.feeStatus === "Pending") return "Pending";
  if (m.feeStatus !== "Paid") return "Unpaid";
  if (m.membershipType === "Lifetime") return "Lifetime";
  const d = daysUntil(m.paidUntil);
  if (d < 0) return "Expired";
  if (d <= 30) return "Expiring";
  return "Active";
}

export function formatDate(date: string) {
  if (!date) return "—";
  const d = new Date(date.length === 10 ? date + "T00:00:00Z" : date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
