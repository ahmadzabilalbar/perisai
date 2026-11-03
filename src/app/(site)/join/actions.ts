"use server";

import { updateTag } from "next/cache";
import { insert, newId, nowIso } from "@/lib/sheets";
import { TAGS, getMembers, getSettings, normalizeStaffNo, today } from "@/lib/data";

export type JoinState = { error?: string; ok?: boolean } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim().slice(0, 500);

export async function submitJoin(_: JoinState, fd: FormData): Promise<JoinState> {
  // Honeypot: bots fill every field
  if (str(fd, "website")) return { ok: true };

  const s = await getSettings();
  if (s.joinEnabled === "FALSE") return { error: "Applications are currently closed." };

  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const staffNo = normalizeStaffNo(str(fd, "staffNo"));
  if (!name || !email || !phone || !str(fd, "staffNo")) {
    return { error: "Please fill in your name, UUM staff number, email and phone number." };
  }
  if (!staffNo) return { error: "Please enter a valid UUM staff number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };

  const members = await getMembers();
  if (members.some((m) => m.staffNo === staffNo)) {
    return { error: "This staff number is already registered. Please contact us if you need help." };
  }
  if (members.some((m) => m.email.toLowerCase() === email)) {
    return { error: "This email is already registered. Please contact us if you need help." };
  }

  const max = members.reduce((n, m) => Math.max(n, Number(m.memberNo.replace(/\D/g, "")) || 0), 0);

  try {
    await insert("Members", {
      id: newId(),
      memberNo: `M${String(max + 1).padStart(4, "0")}`,
      staffNo,
      name,
      email,
      phone,
      icNo: str(fd, "icNo"),
      address: str(fd, "address"),
      membershipType: str(fd, "membershipType") === "Lifetime" ? "Lifetime" : "Annual",
      feeStatus: "Pending",
      joinDate: today(),
      notes: str(fd, "message") ? `Applicant note: ${str(fd, "message")}` : "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  } catch (e) {
    console.error(e);
    return { error: "Something went wrong. Please try again later." };
  }
  updateTag(TAGS.members);
  return { ok: true };
}
