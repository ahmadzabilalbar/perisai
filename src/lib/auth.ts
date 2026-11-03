import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "node:crypto";
import { getUsers } from "./data";

const COOKIE = "perisai_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare fixed-length hashes so the comparison is constant-time
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * superadmin – Google accounts in SUPERADMIN_EMAILS; everything incl. managing users
 * admin      – can view and update (Users sheet, or the shared ADMIN_PASSWORD)
 * viewer     – can view every admin page but cannot update anything
 */
export type Role = "superadmin" | "admin" | "viewer";
export type Session = { role: Role; email?: string };

export const canEdit = (role: Role) => role === "superadmin" || role === "admin";

/** Gmail accounts allowed to sign in with Google as super admin (comma-separated env overrides the default). */
export function superAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS || "ahmadzabilalbar@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isPasswordLoginEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

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

export async function createSession(session: Session = { role: "admin" }) {
  (await cookies()).set(...(await sessionCookie(session)));
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Role for a Google account right now, or null if it has no access. */
export async function roleForEmail(email: string): Promise<Role | null> {
  const e = email.trim().toLowerCase();
  if (superAdminEmails().includes(e)) return "superadmin";
  const user = (await getUsers()).find((u) => u.email === e);
  return user ? user.role : null;
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret()));
  } catch {
    return null;
  }
  const email = typeof payload.email === "string" ? payload.email : undefined;
  // Google sessions: re-check the access list so removals and role changes apply immediately
  if (email) {
    const role = await roleForEmail(email);
    return role ? { role, email } : null;
  }
  return payload.role === "admin" ? { role: "admin" } : null;
}

export async function isAdmin() {
  return (await getSession()) !== null;
}

/** Any signed-in role (incl. viewer). Use for pages that only display data. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

/** Roles that may change data. Use in every server action that writes. */
export async function requireEditor() {
  const s = await requireAdmin();
  if (!canEdit(s.role)) throw new Error("View-only access: you cannot make changes.");
  return s;
}

/** Pages that only make sense for editors (e.g. "Add member"): viewers go back to the dashboard. */
export async function requireEditorPage() {
  const s = await requireAdmin();
  if (!canEdit(s.role)) redirect("/admin");
  return s;
}

export async function requireSuperAdmin() {
  const s = await requireAdmin();
  if (s.role !== "superadmin") redirect("/admin");
  return s;
}
