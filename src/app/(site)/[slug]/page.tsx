import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { getContentBySlug, getPublishedPages } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

/** Builds published pages ahead of time; new ones are still rendered on their first visit. */
export async function generateStaticParams() {
  return (await getPublishedPages()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getContentBySlug("page", (await params).slug);
  return page ? { title: page.title, description: page.excerpt } : {};
}

export default async function CmsPage({ params }: Props) {
  const page = await getContentBySlug("page", (await params).slug);
  if (!page) notFound();

  return (
    <article>
      <header className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 sm:px-6">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {page.title}
          </h1>
          {page.excerpt && <p className="mt-4 text-lg text-slate-600">{page.excerpt}</p>}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {page.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.coverImage} alt="" width={1200} height={675} fetchPriority="high" className="mb-10 aspect-[16/9] w-full rounded-3xl object-cover" />
        )}
        <Markdown className="prose-lg">{page.body}</Markdown>
      </div>
    </article>
  );
}
