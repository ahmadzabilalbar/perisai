import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EditOnly } from "@/components/EditOnly";
import { requireAdmin } from "@/lib/auth";
import { getAllContent } from "@/lib/data";
import { deleteContent } from "../../../actions";
import { ContentForm } from "../ContentForm";

export const metadata: Metadata = { title: "Sunting kandungan" };

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); // shows drafts: check here, not only in the layout
  const { id } = await params;
  const content = (await getAllContent()).find((c) => c.id === id);
  if (!content) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/content" className="text-sm text-slate-500 hover:text-slate-900">
            ← Halaman & Berita
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Sunting {content.type === "post" ? "berita" : "halaman"}
          </h1>
        </div>
        <EditOnly content>
          <form action={deleteContent.bind(null, content.id)}>
            <ConfirmButton message={`Padam "${content.title}"?`} className="btn-ghost !text-rose-600">
              Padam
            </ConfirmButton>
          </form>
        </EditOnly>
      </div>
      <ContentForm key={content.updatedAt} content={content} type={content.type} />
    </div>
  );
}
