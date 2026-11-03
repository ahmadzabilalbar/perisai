"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { Markdown } from "@/components/Markdown";
import { SubmitButton } from "@/components/SubmitButton";
import type { Content } from "@/lib/data";
import { saveContent } from "../../actions";

export function ContentForm({ content, type }: { content?: Content; type: "page" | "post" }) {
  const [state, action] = useActionState(saveContent, undefined);
  const [body, setBody] = useState(content?.body ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      {content && <input type="hidden" name="id" value={content.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="card space-y-4 p-5 sm:p-6">
        <div>
          <label className="label">Title *</label>
          <input name="title" required defaultValue={content?.title} className="input !text-base font-medium" />
        </div>
        <div>
          <label className="label">Summary</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={content?.excerpt}
            placeholder="Short description shown in listings and search results"
            className="input"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label !mb-0">Content</label>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            className={`input font-mono !text-[13px] leading-relaxed ${tab === "preview" ? "hidden" : ""}`}
            placeholder={"## Heading\n\nWrite using **Markdown**. Add images with ![alt](https://…)"}
          />
          {tab === "preview" && (
            <div className="min-h-[24rem] rounded-xl p-4 ring-1 ring-slate-200">
              {body ? <Markdown>{body}</Markdown> : <p className="text-sm text-slate-400">Nothing to preview.</p>}
            </div>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Supports Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>[link](url)</code>,{" "}
            <code>![image](url)</code>, lists and tables.
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-4 p-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Published</span>
            <input
              type="checkbox"
              name="published"
              defaultChecked={content ? content.published : true}
              className="size-5 accent-brand-600"
            />
          </label>
          {type === "page" && (
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Show in menu</span>
              <input
                type="checkbox"
                name="showInNav"
                defaultChecked={content ? content.showInNav : true}
                className="size-5 accent-brand-600"
              />
            </label>
          )}
          <div>
            <label className="label">URL slug</label>
            <div className="flex items-center rounded-xl ring-1 ring-slate-200 ring-inset focus-within:ring-2 focus-within:ring-brand-500">
              <span className="pl-3 text-sm text-slate-400">{type === "post" ? "/news/" : "/"}</span>
              <input
                name="slug"
                defaultValue={content?.slug}
                placeholder="auto from title"
                className="w-full min-w-0 bg-transparent py-2.5 pr-3 text-sm outline-none"
              />
            </div>
          </div>
          {type === "page" && (
            <div>
              <label className="label">Menu order</label>
              <input name="order" type="number" defaultValue={content?.order ?? 0} className="input" />
            </div>
          )}
          <div>
            <label className="label">Cover image URL</label>
            <input name="coverImage" type="url" defaultValue={content?.coverImage} placeholder="https://…" className="input" />
          </div>
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full">{content ? "Save changes" : "Create"}</SubmitButton>
      </aside>
    </form>
  );
}
