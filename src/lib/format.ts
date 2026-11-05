// Pure helpers that are safe to use in both server and client components.

export type MembershipType = "Annual" | "Lifetime";
export type FeeStatus = "Paid" | "Unpaid" | "Pending";
export type MemberState = "Active" | "Lifetime" | "Expiring" | "Expired" | "Unpaid" | "Pending";

// Stored values stay in English (existing sheet data); these are the BM labels shown on screen.
export const MEMBERSHIP_LABEL: Record<MembershipType, string> = { Annual: "Tahunan", Lifetime: "Seumur Hidup" };
export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  Paid: "Sudah Bayar",
  Unpaid: "Belum Bayar",
  Pending: "Menunggu",
};
export const STATE_LABEL: Record<MemberState, string> = {
  Active: "Aktif",
  Lifetime: "Seumur Hidup",
  Expiring: "Hampir Tamat",
  Expired: "Tamat Tempoh",
  Unpaid: "Belum Bayar",
  Pending: "Menunggu",
};

export const GENDERS = ["Lelaki", "Perempuan"] as const;

/** Official OKU categories (JKM registration, certified by a KKM medical officer). A child may have several.
 * JKM's "Pelbagai" (multiple) category is left out on purpose: tick each type that applies instead. */
export const OKU_TYPES = [
  "Pendengaran",
  "Penglihatan",
  "Pertuturan",
  "Fizikal",
  "Masalah Pembelajaran",
  "Mental",
] as const;

/** Plain-language examples shown under each OKU type (display only, not stored). */
export const OKU_EXAMPLES: Record<(typeof OKU_TYPES)[number], string> = {
  Pendengaran: "Pekak, kurang pendengaran, kecacatan telinga",
  Penglihatan: "Buta, penglihatan terhad (low vision), albinisme",
  Pertuturan: "Tidak dapat bertutur dengan jelas, gagap, sumbing lelangit",
  Fizikal: "Cerebral palsy, kudung, lumpuh, spina bifida, kerdil, distrofi otot",
  "Masalah Pembelajaran": "Autisme, Sindrom Down, ADHD, lewat perkembangan (GDD), disleksia",
  Mental: "Skizofrenia, bipolar, kemurungan, kebimbangan teruk, OCD",
};

/**
 * Specific conditions a parent may tick under each OKU type (optional, several allowed).
 * Based on JKM's official OKU registration sub-categories and examples:
 *   https://www.jkm.gov.my/main/article/pendaftaran-orang-kurang-upaya-oku
 * with extra examples from https://www.malaysia.gov.my/my/topics/kategori-oku and
 * JKM Sarawak (https://welfare.sarawak.gov.my/web/subpage/webpage_view/141).
 * Each "Lain-lain" option covers anything else in that category.
 *
 * Stored by name in the sheet: names must be unique across types and must not contain "; ".
 * Renaming an option means existing records with the old name no longer match it.
 */
export const OKU_DETAILS: Record<(typeof OKU_TYPES)[number], readonly string[]> = {
  Pendengaran: [
    "Pekak / kurang pendengaran kedua-dua telinga",
    "Pekak sebelah telinga (single sided deafness)",
    "Kecacatan struktur telinga (microtia, atresia, anotia)",
    "Sindrom berkaitan pendengaran (Treacher Collins, Goldenhar)",
    "Lain-lain masalah pendengaran",
  ],
  Penglihatan: [
    "Buta kedua-dua belah mata",
    "Buta sebelah mata",
    "Penglihatan terhad (low vision)",
    "Albinisme",
    "Retinitis pigmentosa",
    "Lain-lain gangguan penglihatan kekal",
  ],
  Pertuturan: [
    "Tidak boleh bertutur langsung",
    "Kecelaruan pertuturan dan bahasa (complex communication disorder)",
    "Afasia (aphasia)",
    "Apraksia pertuturan (apraxia)",
    "Disartria (dysarthria)",
    "Kecelaruan suara (dysphonia, aphonia)",
    "Gagap (stuttering / cluttering)",
    "Kecelaruan resonans / sumbing lelangit (cleft palate)",
    "Lain-lain masalah pertuturan",
  ],
  Fizikal: [
    "Cerebral palsy",
    "Kehilangan anggota / kudung (limb defect)",
    "Lumpuh (hemiplegia, paraplegia, tetraplegia)",
    "Kecederaan saraf tunjang (spinal cord injury)",
    "Kecederaan otak traumatik (traumatic brain injury)",
    "Strok",
    "Spina bifida",
    "Kerdil (achondroplasia)",
    "Distrofi otot (muscular dystrophy)",
    "Lain-lain masalah fizikal",
  ],
  "Masalah Pembelajaran": [
    "Autisme (autism spectrum disorder)",
    "Sindrom Down",
    "ADHD (attention deficit hyperactivity disorder)",
    "Lewat perkembangan global (GDD)",
    "Kurang upaya intelektual / lembam",
    "Disleksia (dyslexia)",
    "Diskalkulia (dyscalculia)",
    "Disgrafia (dysgraphia)",
    "Lain-lain masalah pembelajaran",
  ],
  Mental: [
    "Skizofrenia",
    "Gangguan delusi / skizoafektif",
    "Bipolar",
    "Kemurungan berulang (recurrent depressive disorder)",
    "Lain-lain gangguan mood",
    "Kebimbangan teruk (anxiety, panik, fobia)",
    "OCD (obsessive compulsive disorder)",
    "Gangguan mental organik (demensia, kerosakan otak)",
    "Lain-lain masalah mental",
  ],
};

/** OKU types (and their details) are stored in one sheet cell each, separated by "; ". */
export const OKU_SEPARATOR = "; ";
export const splitOkuTypes = (v: string) => (v ? v.split(OKU_SEPARATOR).filter(Boolean) : []);

/** Age in whole years on today's date, or null if `dob` is not a valid date. */
export function ageFrom(dob: string) {
  const d = new Date(dob + "T00:00:00Z");
  if (!dob || Number.isNaN(d.getTime())) return null;
  const [y, m, day] = today().split("-").map(Number);
  let age = y - d.getUTCFullYear();
  if (m < d.getUTCMonth() + 1 || (m === d.getUTCMonth() + 1 && day < d.getUTCDate())) age--;
  return age;
}

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
  return d.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Markdown image syntax: ![alt](url) or reference-style ![alt][ref]. News bodies may not contain images. */
export const MARKDOWN_IMAGE = /!\[[^\]]*\]\s*[([]/;

/** WhatsApp link with a pre-filled message and no recipient: the sender picks the chat. */
export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
