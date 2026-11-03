import "server-only";
import { OAuth2Client } from "google-auth-library";

/** "Sign in with Google" for super admins (OAuth web client from Google Cloud Console). */

export const OAUTH_STATE_COOKIE = "perisai_oauth_state";

export function isGoogleLoginEnabled() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function oauthClient(origin: string) {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: `${origin}/api/auth/google/callback`,
  });
}
