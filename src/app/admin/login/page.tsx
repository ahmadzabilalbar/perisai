import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { IconShield } from "@/components/Icons";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -top-40 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <IconShield className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Manage members and website content</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
