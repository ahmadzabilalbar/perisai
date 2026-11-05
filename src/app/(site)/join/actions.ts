"use server";

import { updateTag } from "next/cache";
import { insert, newId, nowIso } from "@/lib/sheets";
import { parseChildren, saveChildren } from "@/lib/children";
import { TAGS, getMembers, getSettings, normalizeStaffNo, today } from "@/lib/data";

export type JoinState = { error?: string; ok?: boolean } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim().slice(0, 500);

export async function submitJoin(_: JoinState, fd: FormData): Promise<JoinState> {
  // Honeypot: bots fill every field
  if (str(fd, "website")) return { ok: true };

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

  const members = await getMembers();
  if (members.some((m) => m.staffNo === staffNo)) {
    return { error: "No. staf ini telah didaftarkan. Sila hubungi kami jika anda memerlukan bantuan." };
  }
  if (members.some((m) => m.email.toLowerCase() === email)) {
    return { error: "E-mel ini telah didaftarkan. Sila hubungi kami jika anda memerlukan bantuan." };
  }

  const max = members.reduce((n, m) => Math.max(n, Number(m.memberNo.replace(/\D/g, "")) || 0), 0);

  const id = newId();
  try {
    await insert("Members", {
      id,
      memberNo: `M${String(max + 1).padStart(4, "0")}`,
      staffNo,
      name,
      email,
      phone,
      membershipType: str(fd, "membershipType") === "Lifetime" ? "Lifetime" : "Annual",
      feeStatus: "Pending",
      joinDate: today(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await saveChildren(id, children);
  } catch (e) {
    console.error(e);
    return { error: "Berlaku ralat. Sila cuba sebentar lagi." };
  }
  updateTag(TAGS.members);
  return { ok: true };
}
