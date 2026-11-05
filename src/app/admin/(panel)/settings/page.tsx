import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { SettingsForm } from "./SettingsForm";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Tetapan" };

export default async function SettingsPage() {
  await requireStaff();
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Tetapan</h1>
        <p className="text-sm text-slate-500">Teks laman utama, yuran keahlian dan maklumat hubungan</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
