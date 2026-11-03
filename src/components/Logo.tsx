/** PERISAI shield emblem (from the official logo-perisai.svg). */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="48 7 258 270" className={className} aria-hidden>
      <path fill="#5371FF" d="M110,24 Q177,9 244,24 L239,69 Q177,56 115,69 Z" />
      <path
        fill="#5371FF"
        d="M50,48 L95,27 L95,68 C99,135 135,185 177,214 C219,185 255,135 259,68 L259,27 L304,48 C306,150 255,235 177,275 C99,235 48,150 50,48 Z"
      />
      <circle cx="177" cy="122" r="36" fill="#FFDE59" />
    </svg>
  );
}

/** Emblem + wordmark. `tone="light"` for dark backgrounds. */
export function Logo({ name, tone = "dark" }: { name: string; tone?: "dark" | "light" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-9 shrink-0" />
      <span className="leading-none">
        <span
          className={`block font-display text-lg font-bold tracking-[0.12em] ${tone === "light" ? "text-white" : "text-slate-900"}`}
        >
          {name}
        </span>
        <span className={`mt-0.5 block text-[10px] font-medium ${tone === "light" ? "text-slate-400" : "text-slate-500"}`}>
          Universiti Utara Malaysia
        </span>
      </span>
    </span>
  );
}
