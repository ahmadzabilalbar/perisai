"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkUserPassword,
  createSession,
  destroySession,
  requireEditor,
  requireSuperAdmin,
  roleForEmail,
  superAdminEmails,
} from "@/lib/auth";
import { isEmailLoginEnabled, sendLoginCode, verifyLoginCode } from "@/lib/login-codes";
import { parseChildren, saveChildren } from "@/lib/children";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/passwords";
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

/** Email + password sign-in (passwords are set per user in Users & access). */
export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const session = await checkUserPassword(str(fd, "email"), String(fd.get("password") ?? ""));
  if (!session) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "E-mel atau kata laluan tidak sah." };
  }
  await createSession(session);
  redirect("/admin");
}

export type CodeState = { step: "email" | "code"; email?: string; error?: string; info?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1 of email sign-in: send a code if the address has access (same reply either way). */
export async function requestLoginCode(_: CodeState, fd: FormData): Promise<CodeState> {
  if (!isEmailLoginEnabled()) return { step: "email", error: "Log masuk melalui e-mel belum dikonfigurasi." };
  const email = str(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { step: "email", error: "Sila masukkan alamat e-mel yang sah." };

  try {
    if (await roleForEmail(email)) await sendLoginCode(email, (await getSettings()).siteName);
    else await new Promise((r) => setTimeout(r, 800)); // don't reveal which emails have access
  } catch (e) {
    console.error("Failed to send sign-in code", e);
    return { step: "email", email, error: "Kod tidak dapat dihantar. Sila cuba lagi kemudian." };
  }
  return {
    step: "code",
    email,
    info: `Jika ${email} mempunyai akses pentadbir, kod 6 digit telah dihantar ke alamat tersebut. Sila semak peti masuk anda (termasuk folder spam).`,
  };
}

/** Step 2 of email sign-in: check the code and start a session. */
export async function verifyLoginCodeAction(_: CodeState, fd: FormData): Promise<CodeState> {
  const email = str(fd, "email").toLowerCase();
  const code = str(fd, "code").replace(/\s+/g, "");
  const role = EMAIL_RE.test(email) ? await roleForEmail(email) : null;
  if (!role || !(await verifyLoginCode(email, code))) {
    await new Promise((r) => setTimeout(r, 600));
    return { step: "code", email, error: "Kod tersebut salah atau telah tamat tempoh. Sila minta kod baharu jika perlu." };
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
  if (!name) return { error: "Nama diperlukan." };
  const staffNo = normalizeStaffNo(str(fd, "staffNo"));
  if (!staffNo) return { error: "No. staf UUM mesti 4 atau 5 digit." };
  if ((await getMembers()).some((m) => m.staffNo === staffNo && m.id !== id)) {
    return { error: `No. staf ${staffNo} telah didaftarkan kepada ahli lain.` };
  }
  const { children, error } = parseChildren(fd);
  if (error) return { error };

  const membershipType = str(fd, "membershipType") === "Lifetime" ? "Lifetime" : "Annual";
  const record = {
    name,
    staffNo,
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    address: str(fd, "address"),
    membershipType,
    feeStatus: str(fd, "feeStatus") || "Unpaid",
    // Annual validity is always calculated (payment date + 1 year) when adding; afterwards "Rekod bayaran" sets it
    paidUntil:
      membershipType === "Lifetime"
        ? ""
        : id
          ? str(fd, "paidUntil")
          : str(fd, "lastPaymentDate") && addYears(str(fd, "lastPaymentDate"), 1),
    lastPaymentDate: str(fd, "lastPaymentDate"),
    lastPaymentAmount: str(fd, "lastPaymentAmount"),
    joinDate: str(fd, "joinDate") || today(),
    notes: str(fd, "notes"),
    updatedAt: nowIso(),
  };

  try {
    if (id) {
      await update("Members", id, record);
      await saveChildren(id, children);
    } else {
      const newMemberId = newId();
      await insert("Members", {
        ...record,
        id: newMemberId,
        memberNo: str(fd, "memberNo") || (await nextMemberNo()),
        createdAt: nowIso(),
      });
      await saveChildren(newMemberId, children);
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
  await saveChildren(id, []);
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
  if (!m) return { error: "Ahli tidak dijumpai." };

  const date = str(fd, "date") || today();
  const amount = str(fd, "amount");
  if (amount && !(/^\d+(\.\d{1,2})?$/.test(amount))) return { error: "Jumlah bayaran tidak sah." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Tarikh bayaran tidak sah." };
  const type = str(fd, "type") === "Lifetime" ? "Lifetime" : "Annual";
  const years = Math.min(5, Math.max(1, Math.trunc(Number(str(fd, "years"))) || 1));

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
  return { ok: type === "Annual" ? `Bayaran direkodkan. Sah sehingga ${paidUntil}.` : "Bayaran seumur hidup direkodkan." };
}

/** Creates (or replaces, revoking the old one) a member's private link for updating their children. */
export async function generateEditLink(id: string) {
  await requireEditor();
  await update("Members", id, { editToken: randomBytes(24).toString("base64url"), updatedAt: nowIso() });
  updateTag(TAGS.members);
}

export async function setFeeStatus(id: string, feeStatus: "Paid" | "Unpaid" | "Pending") {
  await requireEditor();
  const m = await getMember(id);
  const patch: Record<string, string> = { feeStatus, updatedAt: nowIso() };
  // Marking an annual member paid without a current validity starts a 1-year period from today
  if (feeStatus === "Paid" && m?.membershipType === "Annual" && !(m.paidUntil >= today())) {
    patch.lastPaymentDate = today();
    patch.paidUntil = addYears(today(), 1);
  }
  await update("Members", id, patch);
  updateTag(TAGS.members);
}

// ---------------- Content (pages & posts) ----------------

export async function saveContent(_: FormState, fd: FormData): Promise<FormState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Tajuk diperlukan." };
  const type = str(fd, "type") === "post" ? "post" : "page";
  const slug = slugify(str(fd, "slug") || title);
  if (!slug) return { error: "Slug tidak sah." };
  if (type === "page" && ["admin", "news", "join", "api"].includes(slug)) {
    return { error: `"${slug}" ialah URL yang dikhaskan. Sila pilih slug lain.` };
  }

  const all = await getAllContent();
  if (all.some((c) => c.type === type && c.slug === slug && c.id !== id)) {
    return { error: `${type === "post" ? "Berita" : "Halaman"} lain telah menggunakan URL "${slug}".` };
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
  return { ok: "Tetapan disimpan." };
}

// ---------------- Users (super admin only) ----------------

function checkNewPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return `Kata laluan mesti sekurang-kurangnya ${MIN_PASSWORD_LENGTH} aksara.`;
  return null;
}

export async function addUser(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL_RE.test(email)) return { error: "Sila masukkan alamat e-mel yang sah." };
  if (superAdminEmails().includes(email)) return { error: "Akaun tersebut sudah pun pentadbir utama." };
  if ((await getUsers()).some((u) => u.email === email)) return { error: `${email} telah pun ditambah.` };
  const pwError = checkNewPassword(password);
  if (pwError) return { error: pwError };

  try {
    // New admins always start as view-only; the super admin upgrades them later
    await insert("Users", {
      email,
      role: "viewer",
      name: str(fd, "name"),
      addedBy: me.email,
      createdAt: nowIso(),
      passwordHash: await hashPassword(password),
      passwordUpdatedAt: nowIso(),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.users);
  return { ok: `${email} telah ditambah dengan akses lihat sahaja (Pemerhati). Sila kongsikan kata laluan dengan pengguna tersebut secara selamat.` };
}

/** Super admin sets or resets anyone's password (including their own). */
export async function setUserPassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const pwError = checkNewPassword(password);
  if (pwError) return { error: pwError };

  const record = { passwordHash: await hashPassword(password), passwordUpdatedAt: nowIso() };
  try {
    if ((await getUsers()).some((u) => u.email === email)) {
      await update("Users", email, record, "email");
    } else if (superAdminEmails().includes(email)) {
      // Super admins aren't normally listed in the sheet; add a row just to hold the password
      await insert("Users", { email, role: "admin", name: "", addedBy: me.email, createdAt: nowIso(), ...record });
    } else {
      return { error: "Pengguna tidak dijumpai." };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  updateTag(TAGS.users);
  return { ok: "Kata laluan dikemas kini." };
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
