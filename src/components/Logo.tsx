/** PERISAI shield emblem. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 262" className={className} aria-hidden>
      <path fill="#4F6FF6" d="M0 30 Q26 16 54 6 L62 46 Q90 140 130 204 L130 260 Q40 190 0 30 Z" />
      <path fill="#4F6FF6" d="M66 0 Q170 4 260 30 Q222 190 130 260 L130 204 Q172 140 198 46 L68 46 Z" />
      <circle cx="130" cy="106" r="36" fill="#FFD95A" />
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
