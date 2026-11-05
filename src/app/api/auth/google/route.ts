import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, isGoogleLoginEnabled, oauthClient } from "@/lib/google-oauth";

/** Starts "Sign in with Google": redirects to Google's account chooser. */
export async function GET(req: NextRequest) {
  if (!isGoogleLoginEnabled()) {
    return NextResponse.redirect(new URL("/admin/login?error=google_disabled", req.url));
  }
  const state = randomBytes(24).toString("base64url");
  const client = oauthClient(req.nextUrl.origin);
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge: 600,
  };
  res.cookies.set(OAUTH_STATE_COOKIE, state, opts);
  res.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, opts);
  return res;
}
