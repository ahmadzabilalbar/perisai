"use client";

import { useRef, useState } from "react";

type Mode = "write" | "split" | "preview";

/** Wraps the selection (bold, italic, link) or prefixes each selected line (headings, lists, quote). */
type Action =
  | { kind: "wrap"; before: string; after: string; placeholder: string }
  | { kind: "line"; prefix: string | ((i: number) => string) };

type Tool = { label: string; title: string; key?: string; action: Action; className?: string };

const TOOLS: (Tool | "sep")[] = [
  { label: "H2", title: "Tajuk", action: { kind: "line", prefix: "## " }, className: "font-bold" },
  { label: "H3", title: "Subtajuk", action: { kind: "line", prefix: "### " }, className: "font-semibold" },
  "sep",
  { label: "B", title: "Tebal (Ctrl+B)", key: "b", action: { kind: "wrap", before: "**", after: "**", placeholder: "teks tebal" }, className: "font-bold" },
  { label: "I", title: "Condong (Ctrl+I)", key: "i", action: { kind: "wrap", before: "_", after: "_", placeholder: "teks condong" }, className: "italic font-serif" },
  { label: "🔗", title: "Pautan (Ctrl+K)", key: "k", action: { kind: "wrap", before: "[", after: "](https://)", placeholder: "teks pautan" } },
  "sep",
  { label: "•", title: "Senarai", action: { kind: "line", prefix: "- " } },
  { label: "1.", title: "Senarai bernombor", action: { kind: "line", prefix: (i) => `${i + 1}. ` } },
  { label: "❝", title: "Petikan", action: { kind: "line", prefix: "> " } },
];

const IMAGE_TOOL: Tool = {
  label: "🖼",
  title: "Gambar",
  action: { kind: "wrap", before: "![", after: "](https://)", placeholder: "keterangan gambar" },
};

export function BodyEditor({
  value,
  onChange,
  allowImages,
  placeholder,
  renderPreview,
}: {
  value: string;
  onChange: (v: string) => void;
  allowImages: boolean;
  placeholder: string;
  renderPreview: () => React.ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>("write");
  const tools = allowImages ? [...TOOLS, IMAGE_TOOL] : TOOLS;

  function apply(action: Action) {
    const ta = ref.current;
    if (!ta || ta.disabled) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    let next: string;
    let selStart: number;
    let selEnd: number;

    if (action.kind === "wrap") {
      const text = value.slice(start, end) || action.placeholder;
      next = value.slice(0, start) + action.before + text + action.after + value.slice(end);
      selStart = start + action.before.length;
      selEnd = selStart + text.length;
    } else {
      // Whole lines touched by the selection
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const nl = value.indexOf("\n", end);
      const lineEnd = nl === -1 ? value.length : nl;
      const lines = value.slice(lineStart, lineEnd).split("\n");
      const prefixOf = (i: number) => (typeof action.prefix === "function" ? action.prefix(i) : action.prefix);
      // Clicking again removes it; otherwise replace any existing heading/list/quote marker
      const marker = /^(#{1,6} |[-*] |\d+\. |> )/;
      const allHave = lines.every((l, i) => l.startsWith(prefixOf(i)));
      const block = lines.map((l, i) => (allHave ? l.slice(prefixOf(i).length) : prefixOf(i) + l.replace(marker, ""))).join("\n");
      next = value.slice(0, lineStart) + block + value.slice(lineEnd);
      selStart = lineStart;
      selEnd = lineStart + block.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const tool = tools.find((t): t is Tool => t !== "sep" && t.key === e.key.toLowerCase());
    if (tool) {
      e.preventDefault();
      apply(tool.action);
    }
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  const preview = (
    <div className="min-h-[28rem] overflow-auto rounded-b-xl bg-white p-5 sm:p-6">
      {value.trim() ? renderPreview() : <p className="text-sm text-slate-400">Tiada apa-apa untuk dipratonton.</p>}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {mode !== "preview" &&
          tools.map((t, i) =>
            t === "sep" ? (
              <span key={i} className="mx-1 h-5 w-px bg-slate-200" />
            ) : (
              <button
                key={t.title}
                type="button"
                title={t.title}
                aria-label={t.title}
                onMouseDown={(e) => e.preventDefault()} // keep the textarea selection
                onClick={() => apply(t.action)}
                className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm ${t.className ?? ""}`}
              >
                {t.label}
              </button>
            ),
          )}
        <div className="ml-auto flex rounded-lg bg-slate-200/60 p-0.5 text-xs font-medium">
          {(
            [
              ["write", "Tulis"],
              ["split", "Sebelah"],
              ["preview", "Pratonton"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 ${m === "split" ? "hidden lg:block" : ""} ${
                mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={mode === "split" ? "lg:grid lg:grid-cols-2 lg:divide-x lg:divide-slate-200" : ""}>
        <textarea
          ref={ref}
          name="body"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={20}
          placeholder={placeholder}
          className={`block min-h-[28rem] w-full resize-y bg-white p-4 font-mono text-[13px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 ${
            mode === "preview" ? "hidden" : ""
          }`}
        />
        {mode !== "write" && <div className={mode === "split" ? "hidden lg:block" : ""}>{preview}</div>}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        <span>Markdown · Ctrl+B tebal · Ctrl+I condong · Ctrl+K pautan</span>
        <span>
          {words} perkataan{words > 0 ? ` · ~${minutes} min bacaan` : ""}
        </span>
      </div>
    </div>
  );
}
