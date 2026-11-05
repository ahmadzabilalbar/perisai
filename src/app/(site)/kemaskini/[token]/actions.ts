"use server";

import { updateTag } from "next/cache";
import { nowIso, update } from "@/lib/sheets";
import { parseChildren, saveChildren } from "@/lib/children";
import { TAGS, getMemberByToken } from "@/lib/data";

export type UpdateChildrenState = { error?: string; ok?: string } | undefined;

/** Lets a member replace their own children's details via their private link. */
export async function updateMyChildren(
  token: string,
  _: UpdateChildrenState,
  fd: FormData,
): Promise<UpdateChildrenState> {
  const m = await getMemberByToken(token);
  if (!m) return { error: "Pautan ini tidak sah atau telah dibatalkan. Sila hubungi pihak PERISAI." };

  const { children, error } = parseChildren(fd);
  if (error) return { error };
  if (!children.length) return { error: "Sila daftarkan sekurang-kurangnya seorang anak." };

  try {
    await Promise.all([saveChildren(m.id, children), update("Members", m.id, { updatedAt: nowIso() })]);
  } catch (e) {
    console.error(e);
    return { error: "Maaf, berlaku ralat. Sila cuba sebentar lagi." };
  }
  updateTag(TAGS.members);
  return { ok: "Terima kasih! Maklumat anak anda telah dikemas kini." };
}
