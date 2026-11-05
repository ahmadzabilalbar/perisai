import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { getUsers } from "./data";
import { withLockout } from "./login-guard";
import { MAX_PASSWORD_LENGTH, verifyPassword } from "./passwords";

const COOKIE = "perisai_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
}

/**
 * superadmin – emails in SUPERADMIN_EMAILS; everything incl. managing users
 * admin      – can view and update (Users sheet)
 * viewer     – can view every admin page but cannot update anything
 * editor     – can only see and manage Halaman & Berita (pages and news); no member data at all
 */
export type Role = "superadmin" | "admin" | "viewer" | "editor";
export type Session = { role: Role; email: string };

/** May change member, payment and settings data. */
export const canEdit = (role: Role) => role === "superadmin" || role === "admin";
/** May create, edit and delete pages and news (and upload their cover images). */
export const canEditContent = (role: Role) => canEdit(role) || role === "editor";
/** May open admin pages other than Halaman & Berita. Editors are kept away from member data. */
export const canViewAll = (role: Role) => role !== "editor";

/**
 * Accounts that are super admin (comma-separated SUPERADMIN_EMAILS). No built-in default: a missing setting
 * means no super admins, never a hidden one.
 */
export function superAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Email + password sign-in. Returns the session to create, `locked` after too many wrong
 * passwords (see login-guard.ts), or an empty object for a wrong login.
 * Passwords are set per user by the super admin in Users & access.
 * `login` is an email address or a username (anything without "@").
 */
export async function checkUserPassword(
  login: string,
  password: string,
): Promise<{ session?: Session; locked?: boolean }> {
  const l = login.trim().toLowerCase();
  if (!l || !password || password.length > MAX_PASSWORD_LENGTH) return {};
  const user = (await getUsers()).find((u) => (l.includes("@") ? u.email === l : u.username === l));
  if (!user?.passwordHash) return {};
  const result = await withLockout(`pw:${user.email}`, () => verifyPassword(password, user.passwordHash));
  if (result === "locked") return { locked: true };
  if (result !== "ok") return {};
  const role = await roleForEmail(user.email);
  return role ? { session: { role, email: user.email } } : {};
}

/** Signed session cookie (name, value, options), usable with cookies() or a NextResponse. */
export async function sessionCookie(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  return [
    COOKIE,
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: MAX_AGE,
    },
  ] as const;
}

export async function createSession(session: Session) {
  (await cookies()).set(...(await sessionCookie(session)));
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Current role for an email, or null if it has no access. */
export async function roleForEmail(email: string): Promise<Role | null> {
  const e = email.trim().toLowerCase();
  if (superAdminEmails().includes(e)) return "superadmin";
  const user = (await getUsers()).find((u) => u.email === e);
  return user ? user.role : null;
}

/** Checked once per request: layouts, pages and <EditOnly> all call this. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret()));
  } catch {
    return null;
  }
  if (typeof payload.email !== "string") return null; // e.g. old shared-password sessions
  // Re-check the access list so removals and role changes apply immediately
  const role = await roleForEmail(payload.email);
  if (!role) return null;
  // Sessions signed in before a password change are revoked
  const user = (await getUsers()).find((u) => u.email === payload.email);
  const cutoff = user?.sessionsValidAfter ? Math.floor(Date.parse(user.sessionsValidAfter) / 1000) : 0;
  if ((payload.iat ?? 0) < cutoff) return null;
  return { role, email: payload.email };
});

export async function isAdmin() {
  return (await getSession()) !== null;
}

/** Any signed-in role (incl. viewer and editor). Only for Halaman & Berita pages; use requireStaff elsewhere. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

/** Every admin page outside Halaman & Berita (members, statistik, settings…): editors go to the content list. */
export async function requireStaff() {
  const s = await requireAdmin();
  if (!canViewAll(s.role)) redirect("/admin/content");
  return s;
}

/** Roles that may change data. Use in every server action that writes. */
export async function requireEditor() {
  const s = await requireAdmin();
  if (!canEdit(s.role)) throw new Error("Akses lihat sahaja: anda tidak boleh membuat perubahan.");
  return s;
}

/** Pages that only make sense for editors (e.g. "Add member"): viewers go back to the dashboard. */
export async function requireEditorPage() {
  const s = await requireAdmin();
  if (!canEdit(s.role)) redirect("/admin");
  return s;
}

/** Server actions that change pages or news. */
export async function requireContentEditor() {
  const s = await requireAdmin();
  if (!canEditContent(s.role)) throw new Error("Akses lihat sahaja: anda tidak boleh membuat perubahan.");
  return s;
}

/** Pages for writing pages or news (e.g. "New page"): viewers go back to the content list. */
export async function requireContentEditorPage() {
  const s = await requireAdmin();
  if (!canEditContent(s.role)) redirect("/admin/content");
  return s;
}

export async function requireSuperAdmin() {
  const s = await requireAdmin();
  if (s.role !== "superadmin") redirect("/admin");
  return s;
}
