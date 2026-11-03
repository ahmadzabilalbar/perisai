import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn-primary mt-6">
          Back home
        </Link>
      </div>
    </div>
  );
}
