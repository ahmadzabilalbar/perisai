"use server";

import { updateTag } from "next/cache";
import { newId, nowIso } from "@/lib/sheets";
import { parseChildren, saveChildren } from "@/lib/children";
import { clientIp } from "@/lib/client-ip";
import { checkFormToken } from "@/lib/form-token";
import { insertMember } from "@/lib/members";
import { rateLimit } from "@/lib/throttle";
import { TAGS, getMembers, getSettings, normalizeStaffNo, today } from "@/lib/data";

export type JoinState = { error?: string; ok?: boolean } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim().slice(0, 500);

/** Applications from one address per hour (per server instance). */
const PER_IP_PER_HOUR = 5;
/** Applications from everyone per hour, so a flood can't fill the sheet or use up the Sheets API quota. */
const ALL_PER_HOUR = 60;
const HOUR = 60 * 60 * 1000;

const BUSY = "Terlalu banyak permohonan diterima buat masa ini. Sila cuba lagi dalam masa sejam.";

export async function submitJoin(_: JoinState, fd: FormData): Promise<JoinState> {
  // Honeypot (bots fill every field) and signed load-time stamp: pretend success so bots don't adapt
  if (str(fd, "website")) return { ok: true };
  const stamp = checkFormToken(str(fd, "formToken"));
  if (stamp === "bot") return { ok: true };
  if (stamp === "expired") return { error: "Borang ini telah lama dibuka. Sila muat semula halaman dan cuba lagi." };

  const s = await getSettings();
  if (s.joinEnabled === "FALSE") return { error: "Permohonan ditutup buat masa ini." };

  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const staffNo = normalizeStaffNo(str(fd, "staffNo"));
  if (!name || !email || !phone || !str(fd, "staffNo")) {
    return { error: "Sila isi nama, no. staf UUM, e-mel dan no. telefon anda." };
  }
  if (!staffNo) return { error: "No. staf UUM mestilah 4 atau 5 digit." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Sila masukkan alamat e-mel yang sah." };

  const { children, error } = parseChildren(fd);
  if (error) return { error };
  if (!children.length) return { error: "Sila daftarkan sekurang-kurangnya seorang anak." };

  // Only valid-looking applications count towards the limits, so typos don't lock anyone out
  if (!rateLimit(`join:${await clientIp()}`, PER_IP_PER_HOUR, HOUR)) return { error: BUSY };
  const members = await getMembers();
  const since = new Date(Date.now() - HOUR).toISOString();
  if (members.filter((m) => m.feeStatus === "Pending" && m.createdAt >= since).length >= ALL_PER_HOUR) {
    console.warn("Join form: hourly limit reached");
    return { error: BUSY };
  }

  const id = newId();
  try {
    const { conflict } = await insertMember(
      {
        id,
        staffNo,
        name,
        email,
        phone,
        membershipType: str(fd, "membershipType") === "Lifetime" ? "Lifetime" : "Annual",
        feeStatus: "Pending",
        joinDate: today(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      { uniqueEmail: true },
    );
    if (conflict === "staffNo") {
      return { error: "No. staf ini telah didaftarkan. Sila hubungi kami jika anda memerlukan bantuan." };
    }
    if (conflict === "email") {
      return { error: "E-mel ini telah didaftarkan. Sila hubungi kami jika anda memerlukan bantuan." };
    }
    await saveChildren(id, children);
  } catch (e) {
    console.error(e);
    return { error: "Berlaku ralat. Sila cuba sebentar lagi." };
  }
  updateTag(TAGS.members);
  return { ok: true };
}
