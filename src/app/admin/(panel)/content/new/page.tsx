import type { Metadata } from "next";
import Link from "next/link";
import { ContentForm } from "../ContentForm";

export const metadata: Metadata = { title: "New content" };

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const type = (await searchParams).type === "post" ? "post" : "page";
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content" className="text-sm text-slate-500 hover:text-slate-900">
          ← Pages & News
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          {type === "post" ? "New news post" : "New page"}
        </h1>
      </div>
      <ContentForm type={type} />
    </div>
  );
}
