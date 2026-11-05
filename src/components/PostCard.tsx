import Link from "next/link";
import { formatDate } from "@/lib/format";

export function PostCard({
  post,
}: {
  post: { slug: string; title: string; excerpt: string; coverImage: string; createdAt: string };
}) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-100 to-violet-100" />
      )}
      <div className="p-5">
        <time className="text-xs font-medium text-slate-500">{formatDate(post.createdAt)}</time>
        <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 group-hover:text-brand-700">
          {post.title}
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}
      </div>
    </Link>
  );
}
