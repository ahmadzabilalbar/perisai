import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { formatDate, getContentBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getContentBySlug("post", (await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function PostPage({ params }: Props) {
  const post = await getContentBySlug("post", (await params).slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/news" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Semua berita
      </Link>
      <time className="mt-6 block text-sm text-slate-500">{formatDate(post.createdAt)}</time>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        {post.title}
      </h1>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" />
      )}
      <Markdown className="prose-lg mt-10">{post.body}</Markdown>
    </article>
  );
}
