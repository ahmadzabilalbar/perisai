import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { insert, readAll, remove, update } from "./sheets";
import { isMailConfigured, sendMail } from "./mail";
import { withLockout } from "./login-guard";

/** Email sign-in with one-time 6-digit codes, stored (hashed) in the LoginCodes sheet. */

const TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_AFTER_MS = 60 * 1000;

/** Email-code sign-in is offered only when SMTP is set up. */
export function isEmailLoginEnabled() {
  return isMailConfigured();
}

function hash(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}:${process.env.AUTH_SECRET}`).digest("hex");
}

async function findCode(email: string) {
  return (await readAll("LoginCodes")).find((r) => r.email === email) ?? null;
}

/** Creates a code and emails it. Caller must already have checked that the email has access. */
export async function sendLoginCode(email: string, siteName: string) {
  const existing = await findCode(email);
  if (existing && Date.now() - Date.parse(existing.createdAt) < RESEND_AFTER_MS) {
    return; // a code was just sent; don't flood the inbox
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = {
    email,
    codeHash: hash(email, code),
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
    attempts: "0",
    createdAt: new Date().toISOString(),
  };
  if (existing) await update("LoginCodes", email, row, "email");
  else await insert("LoginCodes", row);

  await sendMail({
    to: email,
    subject: `${code} ialah kod log masuk pentadbir ${siteName} anda`,
    text: `Kod log masuk pentadbir ${siteName} anda ialah ${code}.\n\nKod ini akan tamat tempoh dalam masa 10 minit. Jika anda tidak memintanya, sila abaikan e-mel ini.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 8px">Log masuk pentadbir ${siteName}</h2>
  <p style="color:#475569">Gunakan kod ini untuk log masuk. Kod ini akan tamat tempoh dalam masa 10 minit.</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#3b59e8">${code}</p>
  <p style="color:#94a3b8;font-size:13px">Jika anda tidak memintanya, sila abaikan e-mel ini.</p>
</div>`,
  });
}

/**
 * "ok" if the code is correct (and consumes it), "failed" if not, "locked" after too many wrong codes.
 * Each code allows MAX_ATTEMPTS guesses, and withLockout() also counts wrong guesses across codes,
 * so requesting a fresh code every minute doesn't give unlimited guesses. Guesses for the same email
 * run one at a time (withLockout serializes per key).
 */
export function verifyLoginCode(email: string, code: string) {
  return withLockout(`code:${email}`, () => checkCode(email, code));
}

async function checkCode(email: string, code: string) {
  const row = await findCode(email);
  if (!row) return false;
  const attempts = Number(row.attempts) || 0;
  if (Date.now() > Date.parse(row.expiresAt) || attempts >= MAX_ATTEMPTS) {
    await remove("LoginCodes", email, "email");
    return false;
  }
  const given = Buffer.from(hash(email, code));
  const stored = Buffer.from(row.codeHash);
  const ok = /^\d{6}$/.test(code) && given.length === stored.length && timingSafeEqual(given, stored);
  if (ok) await remove("LoginCodes", email, "email");
  else await update("LoginCodes", email, { attempts: String(attempts + 1) }, "email");
  return ok;
}
