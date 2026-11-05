import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Tetapan laman web" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Tetapan laman web</h1>
        <p className="text-sm text-slate-500">Teks laman utama, yuran keahlian dan maklumat hubungan</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
