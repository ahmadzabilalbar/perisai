import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Halaman tidak dijumpai</h1>
        <p className="mt-2 text-slate-500">Halaman yang anda cari tidak wujud atau telah dipindahkan.</p>
        <Link href="/" className="btn-primary mt-6">
          Kembali ke laman utama
        </Link>
      </div>
    </div>
  );
}
