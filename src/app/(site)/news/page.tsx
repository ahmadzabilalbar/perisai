import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/data";

export const metadata: Metadata = { title: "News" };

export default async function NewsPage() {
  const posts = await getPublishedPosts();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">News & updates</h1>
      {posts.length === 0 ? (
        <p className="mt-6 text-slate-500">No news yet. Check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
