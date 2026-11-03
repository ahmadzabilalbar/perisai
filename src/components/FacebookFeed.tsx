/**
 * Latest posts from a public Facebook Page via Facebook's official Page Plugin.
 * No API token needed; it updates automatically when the Page posts.
 * The plugin's own page header is cropped off so only the posts show.
 */
const PLUGIN_HEADER = 71; // px height of the plugin's small header (name, follow button, followers)

export function FacebookFeed({ pageUrl, name, height = 520 }: { pageUrl: string; name: string; height?: number }) {
  const frameHeight = height + PLUGIN_HEADER;
  const src =
    "https://www.facebook.com/plugins/page.php?" +
    new URLSearchParams({
      href: pageUrl,
      tabs: "timeline",
      width: "500",
      height: String(frameHeight),
      small_header: "true",
      adapt_container_width: "true",
      hide_cover: "true",
      show_facepile: "false",
    });

  return (
    <div className="mx-auto w-full max-w-[500px]">
      <div
        className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-900/10 ring-1 ring-slate-900/5"
        style={{ height }}
      >
        <iframe
          src={src}
          title={`${name} on Facebook`}
          width="100%"
          height={frameHeight}
          loading="lazy"
          allow="encrypted-media; clipboard-write; picture-in-picture; web-share"
          className="block w-full border-0"
          style={{ marginTop: -PLUGIN_HEADER }}
        />
      </div>
      <a
        href={pageUrl}
        target="_blank"
        rel="noreferrer"
        className="btn mt-4 w-full bg-[#1877F2] text-white shadow-sm hover:bg-[#166fe0]"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
        </svg>
        Follow us on Facebook
      </a>
    </div>
  );
}
