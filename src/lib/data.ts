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
  siteName: "Perisai",
  tagline: "A community that protects and empowers",
  heroTitle: "Together, we are stronger.",
  heroSubtitle:
    "Join a growing community of members working together. Become a member today and be part of something meaningful.",
  heroImage: "",
  aboutTitle: "About us",
  aboutBody:
    "We are a non-profit association dedicated to supporting our members through programmes, events and a strong network.\n\nEdit this text from **Admin → Website settings**.",
  annualFee: "50",
  lifetimeFee: "500",
  currency: "RM",
  feeNotes: "Annual membership is valid for 12 months from the date of payment.",
  bankDetails: "",
  contactEmail: "hello@example.com",
  contactPhone: "",
  address: "",
  facebook: "",
  instagram: "",
  joinEnabled: "TRUE",
};

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
  { tags: [TAGS.members] },
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
  { tags: [TAGS.members] },
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
  { tags: [TAGS.content] },
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

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    if (!isSheetsConfigured()) return DEFAULT_SETTINGS;
    try {
      const rows = await readAll("Settings");
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      const merged = { ...DEFAULT_SETTINGS };
      for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
        if (map[k] !== undefined && map[k] !== "") merged[k] = map[k];
      }
      return merged;
    } catch (e) {
      console.error("Failed to load settings", e);
      return DEFAULT_SETTINGS;
    }
  },
  ["settings"],
  { tags: [TAGS.settings] },
);
