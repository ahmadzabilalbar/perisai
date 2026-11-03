import type { Metadata } from "next";
import Link from "next/link";
import { EditOnly } from "@/components/AdminRole";
import { IconExternal, IconPlus } from "@/components/Icons";
import { formatDate, getAllContent } from "@/lib/data";

export const metadata: Metadata = { title: "Pages & News" };

export default async function ContentPage() {
  const all = await getAllContent();
  const pages = all.filter((c) => c.type === "page");
  const posts = all.filter((c) => c.type === "post").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Pages & News</h1>
          <p className="text-sm text-slate-500">Manage the content of your public website</p>
        </div>
        <EditOnly>
        <div className="flex gap-2">
          <Link href="/admin/content/new?type=page" className="btn-secondary">
            <IconPlus className="size-4" /> New page
          </Link>
          <Link href="/admin/content/new?type=post" className="btn-primary">
            <IconPlus className="size-4" /> New post
          </Link>
        </div>
        </EditOnly>
      </div>

      <ContentList title="Pages" items={pages} hrefPrefix="/" empty="No pages yet. Create an About or Contact page." />
      <ContentList title="News posts" items={posts} hrefPrefix="/news/" empty="No news posts yet." />
    </div>
  );
}

function ContentList({
  title,
  items,
  hrefPrefix,
  empty,
}: {
  title: string;
  items: Awaited<ReturnType<typeof getAllContent>>;
  hrefPrefix: string;
  empty: string;
}) {
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <Link href={`/admin/content/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{c.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {hrefPrefix}
                  {c.slug} · Updated {formatDate(c.updatedAt)}
                  {c.type === "page" && c.showInNav ? " · In menu" : ""}
                </p>
              </Link>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.published ? "Published" : "Draft"}
              </span>
              {c.published && (
                <a
                  href={`${hrefPrefix}${c.slug}`}
                  target="_blank"
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="View on site"
                >
                  <IconExternal className="size-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
