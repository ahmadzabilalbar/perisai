"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconChart,
  IconCog,
  IconDoc,
  IconExternal,
  IconHome,
  IconLogout,
  IconMenu,
  IconShield,
  IconUsers,
  IconX,
} from "@/components/Icons";
import { LogoMark } from "@/components/Logo";
import { logout } from "../actions";

const NAV = [
  { href: "/admin", label: "Papan Pemuka", icon: IconHome },
  { href: "/admin/members", label: "Ahli", icon: IconUsers },
  { href: "/admin/statistik", label: "Statistik", icon: IconChart },
  { href: "/admin/content", label: "Halaman & Berita", icon: IconDoc },
  { href: "/admin/settings", label: "Tetapan", icon: IconCog },
];

export function AdminNav({ user, role, isSuperAdmin }: { user: string; role: string; isSuperAdmin: boolean }) {
  const nav = isSuperAdmin ? [...NAV, { href: "/admin/users", label: "Pengguna & akses", icon: IconShield }] : NAV;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-6 py-5 font-display text-lg font-bold text-white">
        <LogoMark className="size-8" />
        Pentadbir
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => (
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
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-white" title={user}>
            {user}
          </p>
          <p className="text-xs text-brand-300">{role}</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <IconExternal className="size-5" />
          Lihat laman web
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
            <IconLogout className="size-5" />
            Log keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-950 lg:block print:hidden">{content}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-slate-950 px-4 py-3 lg:hidden print:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display font-bold text-white">
          <LogoMark className="size-7" />
          Pentadbir
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300" aria-label="Buka menu">
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
              aria-label="Tutup menu"
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
