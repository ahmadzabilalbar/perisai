import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { getUsers } from "./data";
import { verifyPassword } from "./passwords";

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
 */
export type Role = "superadmin" | "admin" | "viewer";
export type Session = { role: Role; email: string };

export const canEdit = (role: Role) => role === "superadmin" || role === "admin";

/** Gmail accounts allowed to sign in with Google as super admin (comma-separated env overrides the default). */
export function superAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS || "ahmadzabilalbar@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Email + password sign-in. Returns the session to create, or null.
 * Passwords are set per user by the super admin in Users & access.
 */
export async function checkUserPassword(email: string, password: string): Promise<Session | null> {
  const e = email.trim().toLowerCase();
  const user = (await getUsers()).find((u) => u.email === e);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return null;
  const role = await roleForEmail(e);
  return role ? { role, email: e } : null;
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

export async function getSession(): Promise<Session | null> {
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
  return role ? { role, email: payload.email } : null;
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
  if (!canEdit(s.role)) throw new Error("Akses lihat sahaja: anda tidak boleh membuat perubahan.");
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
