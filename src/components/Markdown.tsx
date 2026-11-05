import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** `noImages` drops any image in the text (news posts: the cover image is the only picture). */
export function Markdown({
  children,
  className = "",
  noImages = false,
}: {
  children: string;
  className?: string;
  noImages?: boolean;
}) {
  return (
    <div
      className={`prose prose-slate max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-brand-600 prose-img:rounded-2xl ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} disallowedElements={noImages ? ["img"] : undefined}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
