/** PERISAI shield emblem. */
export const LOGO_PATH =
  "M60 57 L55 5 L0 30 Q8 178 137 262 Q262 178 268 32 Q166 -2 66 3 L72 56 L205 47 Q194 138 137 203 Q76 148 60 57 Z";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 268 262" className={className} aria-hidden>
      <path fill="#4F6FF6" d={LOGO_PATH} />
      <circle cx="139" cy="110" r="36" fill="#FFD95A" />
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
