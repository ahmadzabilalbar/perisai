"use client";

import { useActionState, useEffect, useState } from "react";
import { useCanEdit } from "@/components/AdminRole";
import { FormMessage } from "@/components/FormMessage";
import { IconExternal } from "@/components/Icons";
import { Markdown } from "@/components/Markdown";
import { formatDate, MARKDOWN_IMAGE, slugify } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import type { Content } from "@/lib/data";
import { saveContent } from "../../actions";
import { BodyEditor } from "./BodyEditor";
import { CoverImageInput } from "./CoverImageInput";

/** Past this the excerpt gets cut off in search results and news cards. */
const EXCERPT_MAX = 160;

export function ContentForm({ content, type }: { content?: Content; type: "page" | "post" }) {
  const [state, action] = useActionState(saveContent, undefined);
  const canEdit = useCanEdit();
  const isPost = type === "post";

  const [title, setTitle] = useState(content?.title ?? "");
  const [excerpt, setExcerpt] = useState(content?.excerpt ?? "");
  const [body, setBody] = useState(content?.body ?? "");
  const [cover, setCover] = useState(content?.coverImage ?? "");
  const [slug, setSlug] = useState(content?.slug ?? "");
  const [published, setPublished] = useState(content ? content.published : true);
  const [dirty, setDirty] = useState(false);

  // Warn before leaving with unsaved changes (closing the tab, reloading)
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  // A failed save keeps the form open: still unsaved
  useEffect(() => {
    if (state?.error) setDirty(true);
  }, [state]);

  const prefix = isPost ? "/news/" : "/";
  const finalSlug = slugify(slug || title);
  const hasImage = isPost && MARKDOWN_IMAGE.test(body);

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="grid items-start gap-6 lg:grid-cols-[1fr_19rem]"
    >
      <fieldset disabled={!canEdit} className="contents">
        {content && <input type="hidden" name="id" value={content.id} />}
        <input type="hidden" name="type" value={type} />

        <div className="min-w-0 space-y-5">
          <div className="card space-y-4 p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="c-title">
                Tajuk *
              </label>
              <input
                id="c-title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isPost ? "Tajuk berita" : "Tajuk halaman"}
                className="input !py-3 font-display !text-xl font-bold"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label" htmlFor="c-excerpt">
                  Ringkasan
                </label>
                <span className={`text-xs ${excerpt.length > EXCERPT_MAX ? "text-amber-600" : "text-slate-400"}`}>
                  {excerpt.length}/{EXCERPT_MAX}
                </span>
              </div>
              <textarea
                id="c-excerpt"
                name="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={
                  isPost
                    ? "Satu atau dua ayat tentang berita ini. Dipaparkan pada kad berita dan hasil carian."
                    : "Penerangan ringkas yang dipaparkan dalam hasil carian"
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Kandungan</label>
            <BodyEditor
              value={body}
              onChange={(v) => {
                setBody(v);
                setDirty(true);
              }}
              allowImages={!isPost}
              placeholder={
                isPost
                  ? "Tulis berita di sini.\n\n## Subtajuk\n\nPerenggan biasa. Pilih teks dan guna butang di atas untuk tebal, pautan atau senarai."
                  : "## Tajuk\n\nTulis kandungan halaman di sini."
              }
              renderPreview={() =>
                isPost ? (
                  // Same layout as the public news page
                  <article className="mx-auto max-w-2xl">
                    <time className="block text-sm text-slate-500">
                      {formatDate(content?.createdAt || new Date().toISOString())}
                    </time>
                    <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
                      {title || "Tajuk berita"}
                    </h1>
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="mt-5 aspect-[16/9] w-full rounded-2xl object-cover" />
                    )}
                    <Markdown noImages className="mt-6">
                      {body}
                    </Markdown>
                  </article>
                ) : (
                  <Markdown>{body}</Markdown>
                )
              }
            />
            {hasImage && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                Berita tidak boleh mengandungi gambar dalam kandungan. Buang <code>![…](…)</code> dan gunakan gambar muka
                depan.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="card space-y-4 p-5">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium text-slate-700">Status</span>
                <span className={`text-xs font-medium ${published ? "text-emerald-600" : "text-slate-500"}`}>
                  {published ? "Diterbitkan: kelihatan kepada umum" : "Draf: tersembunyi daripada umum"}
                </span>
              </span>
              <input
                type="checkbox"
                name="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
            </label>

            <FormMessage state={state} />
            {canEdit && (
              <SubmitButton className="btn-primary w-full" pendingText="Menyimpan…">
                {content ? "Simpan perubahan" : published ? (isPost ? "Terbitkan berita" : "Terbitkan halaman") : "Simpan draf"}
              </SubmitButton>
            )}
            {dirty && canEdit && <p className="text-center text-xs text-amber-600">Ada perubahan yang belum disimpan</p>}

            {content && (
              <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>Dicipta {formatDate(content.createdAt)}</p>
                <p>Dikemas kini {formatDate(content.updatedAt)}</p>
                {content.published && (
                  <a
                    href={`${prefix}${content.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                  >
                    Lihat di laman web <IconExternal className="size-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="card p-5">
            <CoverImageInput
              defaultValue={content?.coverImage}
              onChange={(u) => {
                setCover(u);
                setDirty(true); // uploads and "Buang" don't fire the form's change event
              }}
            />
          </div>

          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="c-slug">
                Slug URL
              </label>
              <input
                id="c-slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto daripada tajuk"
                className="input text-sm"
              />
              <p className="mt-1.5 truncate text-xs text-slate-500" title={`${prefix}${finalSlug}`}>
                {prefix}
                <span className="font-medium text-slate-700">{finalSlug || "…"}</span>
              </p>
            </div>
            {type === "page" && (
              <>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Papar di menu</span>
                  <input
                    type="checkbox"
                    name="showInNav"
                    defaultChecked={content ? content.showInNav : true}
                    className="size-5 accent-brand-600"
                  />
                </label>
                <div>
                  <label className="label">Susunan menu</label>
                  <input name="order" type="number" defaultValue={content?.order ?? 0} className="input" />
                </div>
              </>
            )}
          </div>
        </aside>
      </fieldset>
    </form>
  );
}
