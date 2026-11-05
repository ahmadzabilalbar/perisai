import { NextResponse, type NextRequest } from "next/server";
import { roleForEmail, sessionCookie } from "@/lib/auth";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, oauthClient } from "@/lib/google-oauth";

/** Google redirects here after the user picks an account. */
export async function GET(req: NextRequest) {
  const fail = (error: string) => {
    const res = NextResponse.redirect(new URL(`/admin/login?error=${error}`, req.url));
    clearOauthCookies(res);
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = req.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected || !codeVerifier) return fail("google_failed");

  let session: Awaited<ReturnType<typeof sessionCookie>>;
  try {
    const client = oauthClient(req.nextUrl.origin);
    const { tokens } = await client.getToken({ code, codeVerifier });
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const p = ticket.getPayload();
    const email = p?.email?.toLowerCase();
    if (!email || !p?.email_verified) return fail("google_failed");
    const role = await roleForEmail(email);
    if (!role) return fail("not_allowed");

    session = await sessionCookie({ role, email });
  } catch (e) {
    console.error("Google sign-in failed", e);
    return fail("google_failed");
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(...session);
  clearOauthCookies(res);
  return res;
}

function clearOauthCookies(res: NextResponse) {
  res.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });
  res.cookies.delete({ name: OAUTH_VERIFIER_COOKIE, path: "/api/auth/google" });
}
