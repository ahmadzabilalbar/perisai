import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed "form was loaded at" stamp for public forms. Rejects scripts that post without loading the page,
 * forms submitted faster than a person could fill them in, and very old pages.
 */

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function sign(ts: string) {
  return createHmac("sha256", `form-token:${process.env.AUTH_SECRET ?? ""}`).update(ts).digest("base64url");
}

export function createFormToken() {
  const ts = String(Date.now());
  return `${ts}.${sign(ts)}`;
}

/** "ok", "bot" (forged or too fast: drop silently) or "expired" (ask the person to reload). */
export function checkFormToken(token: string): "ok" | "bot" | "expired" {
  const [ts, mac] = token.split(".");
  if (!ts || !mac) return "bot";
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "bot";
  const age = Date.now() - Number(ts);
  if (!(age >= MIN_AGE_MS)) return "bot";
  return age > MAX_AGE_MS ? "expired" : "ok";
}
