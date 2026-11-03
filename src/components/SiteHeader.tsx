"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconMenu, IconX } from "./Icons";
import { Logo } from "./Logo";

export function SiteHeader({
  siteName,
  links,
  joinEnabled,
}: {
  siteName: string;
  links: { href: string; label: string }[];
  joinEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled || open ? "bg-white/85 shadow-sm shadow-slate-900/5 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={`${siteName} home`}>
          <Logo name={siteName} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "text-brand-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {joinEnabled && (
            <Link href="/join" className="btn-primary ml-3 !py-2">
              Become a member
            </Link>
          )}
        </div>

        <button
          className="btn-ghost -mr-2 !p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <IconX className="size-6" /> : <IconMenu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2.5 text-base font-medium ${
                  isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {joinEnabled && (
              <Link href="/join" className="btn-primary mt-2">
                Become a member
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
