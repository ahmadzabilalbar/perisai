"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  createSession,
  destroySession,
  requireEditor,
  requireSuperAdmin,
  roleForEmail,
  superAdminEmails,
} from "@/lib/auth";
import { isEmailLoginEnabled, sendLoginCode, verifyLoginCode } from "@/lib/login-codes";
import { insert, newId, nowIso, remove, replaceAll, update } from "@/lib/sheets";
import {
  DEFAULT_SETTINGS,
  TAGS,
  addYears,
  getAllContent,
  getMember,
  getMembers,
  getSettings,
  getUsers,
  nextDay,
  normalizeStaffNo,
  today,
  type Settings,
} from "@/lib/data";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------- Auth ----------------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(str(fd, "password"))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "Incorrect password." };
  }
  await createSession();
  redirect("/admin");
}

export type CodeState = { step: "email" | "code"; email?: string; error?: string; info?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1 of email sign-in: send a code if the address has access (same reply either way). */
export async function requestLoginCode(_: CodeState, fd: FormData): Promise<CodeState> {
  if (!isEmailLoginEnabled()) return { step: "email", error: "Email sign-in is not configured." };
  const email = str(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { step: "email", error: "Please enter a valid email address." };

  try {
    if (await roleForEmail(email)) await sendLoginCode(email, (await getSettings()).siteName);
    else await new Promise((r) => setTimeout(r, 800)); // don't reveal which emails have access
  } catch (e) {
    console.error("Failed to send sign-in code", e);
    return { step: "email", email, error: "Could not send the code. Please try again later." };
  }
  return {
    step: "code",
    email,
    info: `If ${email} has admin access, a 6-digit code has been sent to it. Check your inbox (and spam folder).`,
  };
}

/** Step 2 of email sign-in: check the code and start a session. */
export async function verifyLoginCodeAction(_: CodeState, fd: FormData): Promise<CodeState> {
  const email = str(fd, "email").toLowerCase();
  const code = str(fd, "code").replace(/\s+/g, "");
  const role = EMAIL_RE.test(email) ? await roleForEmail(email) : null;
  if (!role || !(await verifyLoginCode(email, code))) {
    await new Promise((r) => setTimeout(r, 600));
    return { step: "code", email, error: "That code is incorrect or has expired. Request a new code if needed." };
  }
  await createSession({ role, email });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------------- Members ----------------

async function nextMemberNo() {
  const members = await getMembers();
  const max = members.reduce((n, m) => Math.max(n, Number(m.memberNo.replace(/\D/g, "")) || 0), 0);
  return `M${String(max + 1).padStart(4, "0")}`;
}

export async function saveMember(_: FormState, fd: FormData): Promise<FormState> {
  await requireEditor();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const staffNo = normalizeStaffNo(str(fd, "staffNo"));
  if (!staffNo) return { error: "UUM staff number must be 4 or 5 digits." };
  if ((await getMembers()).some((m) => m.staffNo === staffNo && m.id !== id)) {
    return { error: `Staff number ${staffNo} is already registered to another member.` };
  }

  const membershipType = str(fd, "membershipType") === "Lifetime" ? "Lifetime" : "Annual";
  const record = {
    name,
    staffNo,
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    icNo: str(fd, "icNo"),
    address: str(fd, "address"),
    membershipType,
    feeStatus: str(fd, "feeStatus") || "Unpaid",
    paidUntil: membershipType === "Lifetime" ? "" : str(fd, "paidUntil"),
    lastPaymentDate: str(fd, "lastPaymentDate"),
    lastPaymentAmount: str(fd, "lastPaymentAmount"),
    joinDate: str(fd, "joinDate") || today(),
    notes: str(fd, "notes"),
    updatedAt: nowIso(),
  };

  try {
    if (id) {
      await update("Members", id, record);
    } else {
      await insert("Members", {
        ...record,
        id: newId(),
        memberNo: str(fd, "memberNo") || (await nextMemberNo()),
        createdAt: nowIso(),
      });
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.members);
  redirect("/admin/members");
}

export async function deleteMember(id: string) {
  await requireEditor();
  await remove("Members", id);
  updateTag(TAGS.members);
  redirect("/admin/members");
}

/**
 * Records a fee payment.
 * Annual: extends validity by `years` from the later of today or the current expiry.
 * Lifetime: marks as paid permanently.
 */
export async function recordPayment(_: FormState, fd: FormData): Promise<FormState> {
  await requireEditor();
  const id = str(fd, "id");
  const m = await getMember(id);
  if (!m) return { error: "Member not found." };

  const date = str(fd, "date") || today();
  const amount = str(fd, "amount");
  const type = str(fd, "type") === "Lifetime" ? "Lifetime" : "Annual";
  const years = Math.max(1, Number(str(fd, "years")) || 1);

  let paidUntil = "";
  let coverage = "Lifetime";
  if (type === "Annual") {
    const stillValid = m.membershipType === "Annual" && m.feeStatus === "Paid" && m.paidUntil >= date;
    // Continue from the day after current expiry, otherwise from the payment date
    const start = stillValid ? nextDay(m.paidUntil) : date;
    paidUntil = addYears(start, years);
    coverage = `${start} → ${paidUntil}`;
  }

  try {
    await insert("Payments", {
      id: newId(),
      memberId: m.id,
      memberName: m.name,
      date,
      type,
      amount,
      coverage,
      note: str(fd, "note"),
    });
    await update("Members", m.id, {
      membershipType: type,
      feeStatus: "Paid",
      paidUntil,
      lastPaymentDate: date,
      lastPaymentAmount: amount,
      updatedAt: nowIso(),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.members);
  return { ok: type === "Annual" ? `Payment recorded. Valid until ${paidUntil}.` : "Lifetime payment recorded." };
}

export async function setFeeStatus(id: string, feeStatus: "Paid" | "Unpaid" | "Pending") {
  await requireEditor();
  await update("Members", id, { feeStatus, updatedAt: nowIso() });
  updateTag(TAGS.members);
}

// ---------------- Content (pages & posts) ----------------

export async function saveContent(_: FormState, fd: FormData): Promise<FormState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  const type = str(fd, "type") === "post" ? "post" : "page";
  const slug = slugify(str(fd, "slug") || title);
  if (!slug) return { error: "Slug is invalid." };
  if (type === "page" && ["admin", "news", "join", "api"].includes(slug)) {
    return { error: `"${slug}" is a reserved URL. Choose another slug.` };
  }

  const all = await getAllContent();
  if (all.some((c) => c.type === type && c.slug === slug && c.id !== id)) {
    return { error: `Another ${type} already uses the URL "${slug}".` };
  }

  const record = {
    type,
    slug,
    title,
    excerpt: str(fd, "excerpt"),
    body: String(fd.get("body") ?? ""),
    coverImage: str(fd, "coverImage"),
    published: fd.get("published") ? "TRUE" : "FALSE",
    showInNav: fd.get("showInNav") ? "TRUE" : "FALSE",
    order: str(fd, "order") || "0",
    updatedAt: nowIso(),
  };

  try {
    if (id) await update("Content", id, record);
    else await insert("Content", { ...record, id: newId(), createdAt: nowIso() });
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.content);
  redirect("/admin/content");
}

export async function deleteContent(id: string) {
  await requireEditor();
  await remove("Content", id);
  updateTag(TAGS.content);
  redirect("/admin/content");
}

// ---------------- Settings ----------------

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireEditor();
  try {
    const current = await getSettings();
    const rows = (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]).map((key) => {
      let value: string = current[key];
      // Checkboxes are omitted from the form data when unchecked
      if (key === "joinEnabled") value = fd.get(key) ? "TRUE" : "FALSE";
      else if (fd.has(key)) value = String(fd.get(key) ?? "").trim();
      return { key, value };
    });
    await replaceAll("Settings", rows);
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.settings);
  return { ok: "Settings saved." };
}

// ---------------- Users (super admin only) ----------------

export async function addUser(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid Google email address." };
  if (superAdminEmails().includes(email)) return { error: "That account is already a super admin." };
  if ((await getUsers()).some((u) => u.email === email)) return { error: `${email} has already been added.` };

  try {
    // New admins always start as view-only; the super admin upgrades them later
    await insert("Users", { email, role: "viewer", name: str(fd, "name"), addedBy: me.email ?? "", createdAt: nowIso() });
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.users);
  return { ok: `${email} added with view-only access.` };
}

export async function setUserRole(email: string, role: "admin" | "viewer") {
  await requireSuperAdmin();
  await update("Users", email, { role }, "email");
  updateTag(TAGS.users);
}

export async function removeUser(email: string) {
  await requireSuperAdmin();
  await remove("Users", email, "email");
  updateTag(TAGS.users);
}
