import "server-only";
import { unstable_cache } from "next/cache";
import { isSheetsConfigured, readAll } from "./sheets";
import type { FeeStatus, MembershipType } from "./format";

export * from "./format";

export interface Member {
  id: string;
  memberNo: string;
  staffNo: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  membershipType: MembershipType;
  feeStatus: FeeStatus;
  paidUntil: string;
  lastPaymentDate: string;
  lastPaymentAmount: string;
  joinDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  editToken: string;
}

export interface Child {
  id: string;
  memberId: string;
  name: string;
  dob: string;
  gender: string;
  okuType: string;
  okuDetail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  type: string;
  amount: string;
  coverage: string;
  note: string;
}

export interface Content {
  id: string;
  type: "page" | "post";
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  published: boolean;
  showInNav: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutTitle: string;
  aboutBody: string;
  annualFee: string;
  lifetimeFee: string;
  currency: string;
  feeNotes: string;
  bankDetails: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebook: string;
  instagram: string;
  joinEnabled: string;
}

export const DEFAULT_SETTINGS: Settings = {
  siteName: "PERISAI",
  tagline: "Persatuan Staf UUM Yang Mempunyai Anak Istimewa",
  heroTitle: "Bersama, kita menyokong setiap anak istimewa.",
  heroSubtitle:
    "PERISAI menghimpunkan staf UUM yang membesarkan anak berkeperluan khas, supaya tiada keluarga yang menempuh perjalanan ini sendirian. Sertai kami untuk mendapatkan sokongan, maklumat dan komuniti yang prihatin.",
  heroImage: "",
  aboutTitle: "Tentang PERISAI",
  aboutBody:
    "**PERISAI (Persatuan Staf UUM Yang Mempunyai Anak Istimewa)** ialah persatuan staf Universiti Utara Malaysia yang mempunyai anak berkeperluan khas.\n\nKami menyediakan rangkaian sokongan untuk keluarga, berkongsi maklumat dan sumber, menganjurkan program serta aktiviti untuk ahli dan anak-anak mereka, dan memperjuangkan komuniti kampus yang lebih inklusif.",
  annualFee: "20",
  lifetimeFee: "100",
  currency: "RM",
  feeNotes: "Keahlian tahunan sah selama 12 bulan dari tarikh bayaran.",
  bankDetails: "",
  contactEmail: "",
  contactPhone: "",
  address: "Universiti Utara Malaysia\n06010 UUM Sintok, Kedah",
  facebook: "https://www.facebook.com/PERISAIUUM/",
  instagram: "",
  joinEnabled: "TRUE",
};

/** Seconds before cached sheet data is re-read, so edits made directly in the sheet show up. */
const REVALIDATE = 300;

export const TAGS = {
  members: "members",
  content: "content",
  settings: "settings",
  users: "users",
} as const;

const bool = (v: string) => v?.toUpperCase() === "TRUE";

// ---------- Readers (cached, invalidated by tag on write) ----------

export const getMembers = unstable_cache(
  async (): Promise<Member[]> => {
    if (!isSheetsConfigured()) return [];
    const rows = await readAll("Members");
    // No IC number column exists (PDPA): only the columns in TABLES.Members are ever read
    return rows.map((r) => ({
      ...(r as unknown as Member),
      membershipType: r.membershipType === "Lifetime" ? "Lifetime" : "Annual",
      feeStatus: (["Paid", "Unpaid", "Pending"].includes(r.feeStatus) ? r.feeStatus : "Unpaid") as FeeStatus,
    }));
  },
  ["members-v2"], // bumped when columns change so old cached rows (e.g. from production) aren't reused
  { tags: [TAGS.members], revalidate: REVALIDATE },
);

export async function getMember(id: string) {
  return (await getMembers()).find((m) => m.id === id) ?? null;
}

/** Member for a private update link, or null if the token is unknown. */
export async function getMemberByToken(token: string) {
  if (!/^[\w-]{20,}$/.test(token)) return null;
  return (await getMembers()).find((m) => m.editToken === token) ?? null;
}

export const getChildren = unstable_cache(
  async (): Promise<Child[]> => {
    if (!isSheetsConfigured()) return [];
    return ((await readAll("Children")) as unknown as Child[]).sort((a, b) => a.dob.localeCompare(b.dob));
  },
  ["children-v2"], // bumped when okuDetail was added
  { tags: [TAGS.members], revalidate: REVALIDATE },
);

export async function getMemberChildren(memberId: string) {
  return (await getChildren()).filter((c) => c.memberId === memberId);
}

export const getPayments = unstable_cache(
  async (): Promise<Payment[]> => {
    if (!isSheetsConfigured()) return [];
    return (await readAll("Payments")) as unknown as Payment[];
  },
  ["payments"],
  { tags: [TAGS.members], revalidate: REVALIDATE },
);

export const getAllContent = unstable_cache(
  async (): Promise<Content[]> => {
    if (!isSheetsConfigured()) return [];
    let rows: Awaited<ReturnType<typeof readAll>>;
    try {
      rows = await readAll("Content");
    } catch (e) {
      // Keep the public site up (and builds passing) if Sheets is unreachable
      console.error("Failed to load content", e);
      return [];
    }
    return rows
      .map((r) => ({
        ...(r as unknown as Content),
        type: (r.type === "post" ? "post" : "page") as Content["type"],
        published: bool(r.published),
        showInNav: bool(r.showInNav),
        order: Number(r.order) || 0,
      }))
      .sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt));
  },
  ["content"],
  { tags: [TAGS.content], revalidate: REVALIDATE },
);

export async function getPublishedPages() {
  return (await getAllContent()).filter((c) => c.type === "page" && c.published);
}

export async function getPublishedPosts() {
  return (await getAllContent())
    .filter((c) => c.type === "post" && c.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getContentBySlug(type: Content["type"], slug: string) {
  return (await getAllContent()).find((c) => c.type === type && c.slug === slug && c.published) ?? null;
}

// Only the sheet values are cached; defaults are merged in afterwards so
// changes to DEFAULT_SETTINGS take effect on the next deploy.
const getStoredSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    if (!isSheetsConfigured()) return {};
    try {
      const rows = await readAll("Settings");
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch (e) {
      console.error("Failed to load settings", e);
      return {};
    }
  },
  ["settings-v2"],
  { tags: [TAGS.settings], revalidate: REVALIDATE },
);

export async function getSettings(): Promise<Settings> {
  const stored = await getStoredSettings();
  const merged = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (stored[k] !== undefined && stored[k] !== "") merged[k] = stored[k];
  }
  return merged;
}

// ---------- Admin users (Google or email + password sign-in) ----------

export type UserRole = "admin" | "viewer";

export interface AdminUser {
  email: string;
  role: UserRole;
  name: string;
  addedBy: string;
  createdAt: string;
  /** scrypt hash; server-only, never send to the browser */
  passwordHash: string;
  passwordUpdatedAt: string;
}

export const getUsers = unstable_cache(
  async (): Promise<AdminUser[]> => {
    if (!isSheetsConfigured()) return [];
    const rows = await readAll("Users");
    return rows
      .filter((r) => r.email)
      .map((r) => ({
        ...(r as unknown as AdminUser),
        email: r.email.trim().toLowerCase(),
        role: r.role === "admin" ? "admin" : "viewer",
      }));
  },
  ["users"],
  { tags: [TAGS.users], revalidate: REVALIDATE },
);
