import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { OAUTH_STATE_COOKIE, isGoogleLoginEnabled, oauthClient } from "@/lib/google-oauth";

/** Starts "Sign in with Google": redirects to Google's account chooser. */
export async function GET(req: NextRequest) {
  if (!isGoogleLoginEnabled()) {
    return NextResponse.redirect(new URL("/admin/login?error=google_disabled", req.url));
  }
  const state = randomBytes(24).toString("base64url");
  const url = oauthClient(req.nextUrl.origin).generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
