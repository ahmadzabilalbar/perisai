import type { Metadata } from "next";
import Link from "next/link";
import { EditOnly } from "@/components/EditOnly";
import { IconExternal, IconPlus } from "@/components/Icons";
import { requireAdmin } from "@/lib/auth";
import { formatDate, getAllContent } from "@/lib/data";

export const metadata: Metadata = { title: "Halaman & Berita" };

export default async function ContentPage() {
  await requireAdmin(); // lists drafts: check here, not only in the layout
  const all = await getAllContent();
  const pages = all.filter((c) => c.type === "page");
  const posts = all.filter((c) => c.type === "post").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Halaman & Berita</h1>
          <p className="text-sm text-slate-500">Urus kandungan laman web awam anda</p>
        </div>
        <EditOnly content>
        <div className="flex gap-2">
          <Link href="/admin/content/new?type=page" className="btn-secondary">
            <IconPlus className="size-4" /> Halaman baharu
          </Link>
          <Link href="/admin/content/new?type=post" className="btn-primary">
            <IconPlus className="size-4" /> Berita baharu
          </Link>
        </div>
        </EditOnly>
      </div>

      <ContentList title="Halaman" items={pages} hrefPrefix="/" empty="Belum ada halaman. Cipta halaman Tentang Kami atau Hubungi Kami." />
      <ContentList title="Berita" items={posts} hrefPrefix="/news/" empty="Belum ada berita." />
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
              {c.type === "post" &&
                (c.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverImage} alt="" className="aspect-[16/9] w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="grid aspect-[16/9] w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                    Tiada gambar
                  </div>
                ))}
              <Link href={`/admin/content/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{c.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {hrefPrefix}
                  {c.slug} · Dikemas kini {formatDate(c.updatedAt)}
                  {c.type === "page" && c.showInNav ? " · Dalam menu" : ""}
                </p>
              </Link>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.published ? "Diterbitkan" : "Draf"}
              </span>
              {c.published && (
                <a
                  href={`${hrefPrefix}${c.slug}`}
                  target="_blank"
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Lihat di laman web"
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
