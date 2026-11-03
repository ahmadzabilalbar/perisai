import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getSettings } from "@/lib/data";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Become a member" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const [s, { plan }] = await Promise.all([getSettings(), searchParams]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[2fr_3fr]">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">Become a member</h1>
        <p className="mt-4 text-lg text-slate-600">
          Fill in the form and our team will review your application. {s.feeNotes}
        </p>
        {s.bankDetails && (
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <h2 className="font-display font-semibold text-slate-900">Payment details</h2>
            <Markdown className="prose-sm mt-2">{s.bankDetails}</Markdown>
          </div>
        )}
      </div>
      {s.joinEnabled === "FALSE" ? (
        <div className="card p-10 text-center text-slate-600">Applications are currently closed.</div>
      ) : (
        <JoinForm
          defaultPlan={plan === "Lifetime" ? "Lifetime" : "Annual"}
          currency={s.currency}
          annualFee={s.annualFee}
          lifetimeFee={s.lifetimeFee}
        />
      )}
    </div>
  );
}
