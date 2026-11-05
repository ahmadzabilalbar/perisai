import "server-only";
import { canEdit, canEditContent, getSession } from "@/lib/auth";

/**
 * Renders children only for users who can edit.
 * This is a server component on purpose: for view-only users the children (and the props passed to
 * them, e.g. a member's private update link) are never sent to the browser at all.
 * `content`: for Halaman & Berita controls, which editors may also use.
 */
export async function EditOnly({ children, content }: { children: React.ReactNode; content?: boolean }) {
  const s = await getSession();
  return s && (content ? canEditContent(s.role) : canEdit(s.role)) ? <>{children}</> : null;
}
