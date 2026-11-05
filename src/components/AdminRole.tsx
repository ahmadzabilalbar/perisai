"use client";

import { createContext, useContext } from "react";

/** Whether the signed-in admin may change data (false for view-only users). Enforced again on the server. */
const CanEditContext = createContext(false);

export function AdminRoleProvider({ canEdit, children }: { canEdit: boolean; children: React.ReactNode }) {
  return <CanEditContext.Provider value={canEdit}>{children}</CanEditContext.Provider>;
}

/** For disabling inputs in client forms. To hide something from viewers, use the server <EditOnly> instead. */
export const useCanEdit = () => useContext(CanEditContext);
