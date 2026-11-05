import "server-only";
import { canEdit, getSession } from "@/lib/auth";

/**
 * Renders children only for users who can edit.
 * This is a server component on purpose: for view-only users the children (and the props passed to
 * them, e.g. a member's private update link) are never sent to the browser at all.
 */
export async function EditOnly({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return s && canEdit(s.role) ? <>{children}</> : null;
}
