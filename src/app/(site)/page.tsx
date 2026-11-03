import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { Markdown } from "@/components/Markdown";
import { PostCard } from "@/components/PostCard";
import { IconArrowRight, IconCheck } from "@/components/Icons";
import { getPublishedPosts, getSettings } from "@/lib/data";

export default async function HomePage() {
  const [s, posts] = await Promise.all([getSettings(), getPublishedPosts()]);
  const joinEnabled = s.joinEnabled !== "FALSE";

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
        <div className="absolute -top-40 left-1/2 -z-10 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-200/60 via-sky-100/50 to-violet-200/50 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-500" />
              {s.tagline}
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {s.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{s.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {joinEnabled && (
                <Link href="/join" className="btn-primary !px-5 !py-3">
                  Join now <IconArrowRight className="size-4" />
                </Link>
              )}
              <a href="#membership" className="btn-secondary !px-5 !py-3">
                Membership fees
              </a>
            </div>
          </div>
          {s.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.heroImage}
              alt=""
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl shadow-brand-900/10 ring-1 ring-slate-900/5"
            />
          ) : (
            <div className="relative hidden aspect-[4/3] lg:block">
              <div className="absolute inset-6 rotate-3 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 opacity-90" />
              <div className="absolute inset-6 -rotate-2 rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-slate-900/5 backdrop-blur">
                <div className="flex items-start justify-between">
                  <div className="font-display text-sm font-semibold text-brand-700">Member card</div>
                  <LogoMark className="size-14" />
                </div>
                <div className="mt-2 font-display text-3xl font-bold tracking-[0.12em] text-slate-900">{s.siteName}</div>
                <div className="mt-2 text-slate-500">{s.tagline}</div>
                <div className="absolute inset-x-8 bottom-8 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-400">MEMBER NO.</div>
                    <div className="font-mono text-lg tracking-widest text-slate-700">M0001</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">{s.aboutTitle}</h2>
          <Markdown className="prose-lg">{s.aboutBody}</Markdown>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="scroll-mt-20 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Membership</h2>
            <p className="mt-3 text-slate-600">{s.feeNotes}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Plan
              name="Annual"
              price={`${s.currency} ${s.annualFee}`}
              period="/ year"
              features={["Full member benefits", "Valid for 12 months", "Renew anytime"]}
              joinEnabled={joinEnabled}
            />
            <Plan
              name="Lifetime"
              price={`${s.currency} ${s.lifetimeFee}`}
              period="one-time"
              features={["All annual benefits", "Never expires", "One-time payment"]}
              highlight
              joinEnabled={joinEnabled}
            />
          </div>
        </div>
      </section>

      {/* News */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">Latest news</h2>
            <Link href="/news" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Plan({
  name,
  price,
  period,
  features,
  highlight,
  joinEnabled,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  joinEnabled: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl p-8 ${
        highlight ? "bg-slate-900 text-white shadow-xl shadow-brand-900/20" : "card"
      }`}
    >
      {highlight && (
        <span className="absolute top-6 right-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold">
          Best value
        </span>
      )}
      <h3 className={`font-display text-lg font-semibold ${highlight ? "text-brand-300" : "text-brand-700"}`}>
        {name}
      </h3>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold tracking-tight">{price}</span>
        <span className={highlight ? "text-slate-400" : "text-slate-500"}>{period}</span>
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <IconCheck className={`size-5 ${highlight ? "text-brand-400" : "text-brand-600"}`} />
            {f}
          </li>
        ))}
      </ul>
      {joinEnabled && (
        <Link
          href={`/join?plan=${name}`}
          className={`mt-8 w-full ${highlight ? "btn bg-white text-slate-900 hover:bg-slate-100" : "btn-primary"}`}
        >
          Choose {name}
        </Link>
      )}
    </div>
  );
}
