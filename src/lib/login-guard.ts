import "server-only";
import { insert, readAll, remove, update } from "./sheets";

/**
 * Brute-force protection for sign-in.
 *
 * - serialize(): requests for the same key run one at a time on this server instance, so a burst of
 *   parallel guesses can't all read the same "attempts so far" count before any of them records a failure.
 * - withLockout(): after MAX_FAILURES wrong passwords within WINDOW_MS the account is locked for LOCK_MS,
 *   even for the right password. The count is kept in the LoginAttempts sheet, so it is shared by every
 *   server instance. A locked-out admin can still sign in with Google or an email code.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
export const LOCK_MINUTES = LOCK_MS / 60_000;

const queues = new Map<string, Promise<unknown>>();

export function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).then(fn, fn);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  queues.set(key, tail);
  void tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
  return run;
}

export type AttemptResult = "ok" | "failed" | "locked";

export function withLockout(key: string, attempt: () => Promise<boolean>): Promise<AttemptResult> {
  return serialize(key, async () => {
    const rec = (await readAll("LoginAttempts")).find((r) => r.key === key) ?? null;
    const now = Date.now();
    if (rec?.lockedUntil && Date.parse(rec.lockedUntil) > now) return "locked";

    if (await attempt()) {
      if (rec) await remove("LoginAttempts", key, "key");
      return "ok";
    }

    // A lock that has run out starts a fresh count
    const inWindow = rec && !rec.lockedUntil && now - Date.parse(rec.firstFailureAt) < WINDOW_MS;
    const failures = inWindow ? (Number(rec.failures) || 0) + 1 : 1;
    const row = {
      key,
      failures: String(failures),
      firstFailureAt: inWindow ? rec.firstFailureAt : new Date(now).toISOString(),
      lockedUntil: failures >= MAX_FAILURES ? new Date(now + LOCK_MS).toISOString() : "",
    };
    if (rec) await update("LoginAttempts", key, row, "key");
    else await insert("LoginAttempts", row);
    return failures >= MAX_FAILURES ? "locked" : "failed";
  });
}
