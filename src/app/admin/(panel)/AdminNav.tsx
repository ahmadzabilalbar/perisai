"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconCog,
  IconDoc,
  IconExternal,
  IconHome,
  IconLogout,
  IconMenu,
  IconUsers,
  IconX,
} from "@/components/Icons";
import { LogoMark } from "@/components/Logo";
import { logout } from "../actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: IconHome },
  { href: "/admin/members", label: "Members", icon: IconUsers },
  { href: "/admin/content", label: "Pages & News", icon: IconDoc },
  { href: "/admin/settings", label: "Website settings", icon: IconCog },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-6 py-5 font-display text-lg font-bold text-white">
        <LogoMark className="size-8" />
        Admin
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(href) ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <IconExternal className="size-5" />
          View website
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
            <IconLogout className="size-5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-950 lg:block">{content}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-slate-950 px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display font-bold text-white">
          <LogoMark className="size-7" />
          Admin
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300" aria-label="Open menu">
          <IconMenu className="size-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-slate-950 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400"
              aria-label="Close menu"
            >
              <IconX className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
