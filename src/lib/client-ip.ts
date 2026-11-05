import "server-only";
import { headers } from "next/headers";

/**
 * The visitor's IP, for rate limits. Vercel sets x-real-ip itself (a client can't override it). Elsewhere, use the
 * last x-forwarded-for entry, which the nearest proxy added: the first entry is whatever the client chose to send.
 */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}
