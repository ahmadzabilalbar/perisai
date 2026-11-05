import type { Metadata } from "next";
import { getMemberByToken, getMemberChildren } from "@/lib/data";
import { UpdateChildrenForm } from "./UpdateChildrenForm";

// Private per-member page: keep it out of search engines
export const metadata: Metadata = { title: "Kemas kini maklumat anak", robots: { index: false, follow: false } };

// Shows one family's children details: always render per request, never keep a cached copy on the server
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function UpdateChildrenPage({ params }: Props) {
  const { token } = await params;
  const m = await getMemberByToken(token);

  if (!m) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="card p-10 text-center text-slate-600">
          Pautan ini tidak sah atau telah dibatalkan. Sila hubungi pihak PERISAI untuk mendapatkan pautan baharu.
        </div>
      </div>
    );
  }

  const childList = await getMemberChildren(m.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Kemas kini maklumat anak</h1>
      <p className="mt-3 text-slate-600">
        Assalamualaikum dan salam sejahtera, <strong>{m.name}</strong>. Sila semak dan kemas kini maklumat anak
        istimewa (OKU) anda. Tekan &ldquo;Tambah anak lain&rdquo; jika anda mempunyai lebih daripada seorang anak.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Pautan ini adalah peribadi untuk anda. Sila jangan kongsikan dengan orang lain.
      </p>
      <div className="mt-8">
        <UpdateChildrenForm token={token} childList={childList} />
      </div>
    </div>
  );
}
