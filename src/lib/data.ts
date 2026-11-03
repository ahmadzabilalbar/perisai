import "server-only";
import { unstable_cache } from "next/cache";
import { isSheetsConfigured, readAll } from "./sheets";
import type { FeeStatus, MembershipType } from "./format";

export * from "./format";

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  email: string;
  phone: string;
  icNo: string;
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
  heroTitle: "Together, we support every special child.",
  heroSubtitle:
    "PERISAI brings together UUM staff who are raising children with special needs, so no family walks this journey alone. Join us for support, information and a caring community.",
  heroImage: "",
  aboutTitle: "About PERISAI",
  aboutBody:
    "**PERISAI (Persatuan Staf UUM Yang Mempunyai Anak Istimewa)** is an association of Universiti Utara Malaysia staff who have children with special needs.\n\nWe provide a support network for families, share information and resources, organise programmes and activities for our members and their children, and advocate for a more inclusive campus community.",
  annualFee: "50",
  lifetimeFee: "500",
  currency: "RM",
  feeNotes: "Annual membership is valid for 12 months from the date of payment.",
  bankDetails: "",
  contactEmail: "",
  contactPhone: "",
  address: "Universiti Utara Malaysia\n06010 UUM Sintok, Kedah",
  facebook: "",
  instagram: "",
  joinEnabled: "TRUE",
};

/** Seconds before cached sheet data is re-read, so edits made directly in the sheet show up. */
const REVALIDATE = 300;

export const TAGS = {
  members: "members",
  content: "content",
  settings: "settings",
} as const;

const bool = (v: string) => v?.toUpperCase() === "TRUE";

// ---------- Readers (cached, invalidated by tag on write) ----------

export const getMembers = unstable_cache(
  async (): Promise<Member[]> => {
    if (!isSheetsConfigured()) return [];
    const rows = await readAll("Members");
    return rows.map((r) => ({
      ...(r as unknown as Member),
      membershipType: r.membershipType === "Lifetime" ? "Lifetime" : "Annual",
      feeStatus: (["Paid", "Unpaid", "Pending"].includes(r.feeStatus) ? r.feeStatus : "Unpaid") as FeeStatus,
    }));
  },
  ["members"],
  { tags: [TAGS.members], revalidate: REVALIDATE },
);

export async function getMember(id: string) {
  return (await getMembers()).find((m) => m.id === id) ?? null;
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
