"use client";

import { useActionState, useState } from "react";
import { useCanEdit } from "@/components/AdminRole";
import { FormMessage } from "@/components/FormMessage";
import { Markdown } from "@/components/Markdown";
import { MARKDOWN_IMAGE } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import type { Content } from "@/lib/data";
import { saveContent } from "../../actions";
import { CoverImageInput } from "./CoverImageInput";

export function ContentForm({ content, type }: { content?: Content; type: "page" | "post" }) {
  const [state, action] = useActionState(saveContent, undefined);
  const canEdit = useCanEdit();
  const [body, setBody] = useState(content?.body ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const isPost = type === "post";

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <fieldset disabled={!canEdit} className="contents">
      {content && <input type="hidden" name="id" value={content.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="card space-y-4 p-5 sm:p-6">
        <div>
          <label className="label">Tajuk *</label>
          <input name="title" required defaultValue={content?.title} className="input !text-base font-medium" />
        </div>
        <div>
          <label className="label">Ringkasan</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={content?.excerpt}
            placeholder="Penerangan ringkas yang dipaparkan dalam senarai dan hasil carian"
            className="input"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label !mb-0">Kandungan</label>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  {t === "write" ? "Tulis" : "Pratonton"}
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
            placeholder={
              isPost
                ? "## Tajuk\n\nTulis menggunakan **Markdown**."
                : "## Tajuk\n\nTulis menggunakan **Markdown**. Tambah gambar dengan ![alt](https://…)"
            }
          />
          {tab === "preview" && (
            <div className="min-h-[24rem] rounded-xl p-4 ring-1 ring-slate-200">
              {body ? (
                <Markdown noImages={isPost}>{body}</Markdown>
              ) : (
                <p className="text-sm text-slate-400">Tiada apa-apa untuk dipratonton.</p>
              )}
            </div>
          )}
          {isPost && MARKDOWN_IMAGE.test(body) && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              Berita tidak boleh mengandungi gambar dalam kandungan. Buang <code>![…](…)</code> dan gunakan gambar muka depan.
            </p>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Menyokong Markdown: <code>## Tajuk</code>, <code>**tebal**</code>, <code>[pautan](url)</code>,{" "}
            {isPost ? (
              <>senarai dan jadual. Gambar hanya melalui gambar muka depan.</>
            ) : (
              <>
                <code>![gambar](url)</code>, senarai dan jadual.
              </>
            )}
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-4 p-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Diterbitkan</span>
            <input
              type="checkbox"
              name="published"
              defaultChecked={content ? content.published : true}
              className="size-5 accent-brand-600"
            />
          </label>
          {type === "page" && (
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Papar di menu</span>
              <input
                type="checkbox"
                name="showInNav"
                defaultChecked={content ? content.showInNav : true}
                className="size-5 accent-brand-600"
              />
            </label>
          )}
          <div>
            <label className="label">Slug URL</label>
            <div className="flex items-center rounded-xl ring-1 ring-slate-200 ring-inset focus-within:ring-2 focus-within:ring-brand-500">
              <span className="pl-3 text-sm text-slate-400">{type === "post" ? "/news/" : "/"}</span>
              <input
                name="slug"
                defaultValue={content?.slug}
                placeholder="auto daripada tajuk"
                className="w-full min-w-0 bg-transparent py-2.5 pr-3 text-sm outline-none"
              />
            </div>
          </div>
          {type === "page" && (
            <div>
              <label className="label">Susunan menu</label>
              <input name="order" type="number" defaultValue={content?.order ?? 0} className="input" />
            </div>
          )}
          <CoverImageInput defaultValue={content?.coverImage} />
        </div>
        <FormMessage state={state} />
        {canEdit && <SubmitButton className="btn-primary w-full">{content ? "Simpan perubahan" : "Cipta"}</SubmitButton>}
      </aside>
      </fieldset>
    </form>
  );
}
