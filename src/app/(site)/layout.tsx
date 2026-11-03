import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { IconMail, IconPhone, IconPin } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { getPublishedPages, getPublishedPosts, getSettings } from "@/lib/data";

export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, pages, posts] = await Promise.all([getSettings(), getPublishedPages(), getPublishedPosts()]);
  const links = [
    { href: "/", label: "Home" },
    ...pages.filter((p) => p.showInNav).map((p) => ({ href: `/${p.slug}`, label: p.title })),
    ...(posts.length ? [{ href: "/news", label: "News" }] : []),
  ];
  const joinEnabled = s.joinEnabled !== "FALSE";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader siteName={s.siteName} links={links} joinEnabled={joinEnabled} />
      <main className="flex-1">{children}</main>

      <footer className="mt-24 bg-slate-950 text-slate-400">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <Logo name={s.siteName} tone="light" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed">{s.tagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
              {joinEnabled && (
                <li>
                  <Link href="/join" className="hover:text-white">
                    Join us
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {s.contactEmail && (
                <li className="flex gap-2">
                  <IconMail className="size-5 shrink-0" />
                  <a href={`mailto:${s.contactEmail}`} className="hover:text-white">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s.contactPhone && (
                <li className="flex gap-2">
                  <IconPhone className="size-5 shrink-0" />
                  <a href={`tel:${s.contactPhone}`} className="hover:text-white">
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {s.address && (
                <li className="flex gap-2">
                  <IconPin className="size-5 shrink-0" />
                  <span className="whitespace-pre-line">{s.address}</span>
                </li>
              )}
            </ul>
            <div className="mt-4 flex gap-3 text-sm">
              {s.facebook && (
                <a href={s.facebook} target="_blank" rel="noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {s.instagram && (
                <a href={s.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs sm:px-6">
            <p>
              © {new Date().getFullYear()} {s.siteName}. All rights reserved.
            </p>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
