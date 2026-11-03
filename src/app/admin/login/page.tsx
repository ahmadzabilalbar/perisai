import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isGoogleLoginEnabled } from "@/lib/google-oauth";
import { LogoMark } from "@/components/Logo";
import { isEmailLoginEnabled } from "@/lib/login-codes";
import { EmailLogin } from "./EmailLogin";
import { LoginForm } from "./LoginForm";

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      {children}
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export const metadata: Metadata = { title: "Admin sign in" };

const ERRORS: Record<string, string> = {
  not_allowed: "This account does not have access. Ask the PERISAI super admin to add you.",
  google_failed: "Google sign-in failed. Please try again.",
  google_disabled: "Google sign-in is not configured yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const google = isGoogleLoginEnabled();
  const email = isEmailLoginEnabled();

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -top-40 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white shadow-lg shadow-brand-600/30">
            <LogoMark className="size-10" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Manage members and website content</p>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
          {error && ERRORS[error] && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {ERRORS[error]}
            </p>
          )}

          {google && (
            <a href="/api/auth/google" className="btn-secondary w-full !py-3">
              <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Sign in with Google
            </a>
          )}

          {google && <Divider>or sign in with email and password</Divider>}

          <LoginForm />

          {email && (
            <details className="pt-1">
              <summary className="cursor-pointer list-none text-center text-xs text-slate-400 hover:text-slate-600">
                Forgot password? Email me a sign-in code
              </summary>
              <div className="mt-3">
                <EmailLogin />
              </div>
            </details>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
