import { LogoMark } from "./Logo";

/**
 * Latest posts from a public Facebook Page via Facebook's official Page Plugin.
 * No API token needed; it updates automatically when the Page posts.
 */
export function FacebookFeed({ pageUrl, name, height = 560 }: { pageUrl: string; name: string; height?: number }) {
  const src =
    "https://www.facebook.com/plugins/page.php?" +
    new URLSearchParams({
      href: pageUrl,
      tabs: "timeline",
      width: "500",
      height: String(height),
      small_header: "true",
      adapt_container_width: "true",
      hide_cover: "false",
      show_facepile: "false",
    });

  return (
    <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-900/10 ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-7" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Latest from Facebook</p>
            <p className="text-xs text-slate-500">{name}</p>
          </div>
        </div>
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166fe0]"
        >
          Follow
        </a>
      </div>
      <iframe
        src={src}
        title={`${name} on Facebook`}
        width="100%"
        height={height}
        loading="lazy"
        allow="encrypted-media; clipboard-write; picture-in-picture; web-share"
        className="block w-full border-0"
      />
    </div>
  );
}
