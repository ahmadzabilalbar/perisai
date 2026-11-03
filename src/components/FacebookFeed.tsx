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
    <div
      className="mx-auto w-full max-w-[500px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-900/10 ring-1 ring-slate-900/5"
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
  );
}
