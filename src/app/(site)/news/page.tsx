import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/data";

export const metadata: Metadata = { title: "Berita" };

export default async function NewsPage() {
  const posts = await getPublishedPosts();

  // Posts arrive newest first, so years come out in descending order. UTC year, matching formatDate.
  const byYear = new Map<string, typeof posts>();
  for (const p of posts) {
    const year = p.createdAt.slice(0, 4) || "—";
    byYear.set(year, [...(byYear.get(year) ?? []), p]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">Berita &amp; makluman</h1>
      {posts.length === 0 ? (
        <p className="mt-6 text-slate-500">Belum ada berita. Sila semak semula kemudian.</p>
      ) : (
        [...byYear].map(([year, list]) => (
          <section key={year} aria-labelledby={`tahun-${year}`} className="mt-12 first-of-type:mt-10">
            <h2
              id={`tahun-${year}`}
              className="flex items-center gap-4 font-display text-2xl font-bold text-slate-900"
            >
              {year}
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
              <span className="text-sm font-medium text-slate-500">{list.length} berita</span>
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
