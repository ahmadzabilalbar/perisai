import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { getAllContent } from "@/lib/data";
import { deleteContent } from "../../../actions";
import { ContentForm } from "../ContentForm";

export const metadata: Metadata = { title: "Edit content" };

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = (await getAllContent()).find((c) => c.id === id);
  if (!content) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/content" className="text-sm text-slate-500 hover:text-slate-900">
            ← Pages & News
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Edit {content.type === "post" ? "post" : "page"}
          </h1>
        </div>
        <form action={deleteContent.bind(null, content.id)}>
          <ConfirmButton message={`Delete "${content.title}"?`} className="btn-ghost !text-rose-600">
            Delete
          </ConfirmButton>
        </form>
      </div>
      <ContentForm key={content.updatedAt} content={content} type={content.type} />
    </div>
  );
}
