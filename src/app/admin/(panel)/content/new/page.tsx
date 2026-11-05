import type { Metadata } from "next";
import Link from "next/link";
import { requireContentEditorPage } from "@/lib/auth";
import { ContentForm } from "../ContentForm";

export const metadata: Metadata = { title: "Kandungan baharu" };

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireContentEditorPage();
  const type = (await searchParams).type === "post" ? "post" : "page";
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content" className="text-sm text-slate-500 hover:text-slate-900">
          ← Halaman & Berita
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          {type === "post" ? "Berita baharu" : "Halaman baharu"}
        </h1>
      </div>
      <ContentForm type={type} />
    </div>
  );
}
