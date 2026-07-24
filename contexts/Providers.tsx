import type { ReactNode } from "react";

import { AuthProvider } from "./AuthContext";
import { SavedSplitsProvider } from "./SavedSplitsContext";
import { SplitDraftProvider } from "./SplitDraftContext";

/**
 * Order matters: saved splits read the auth token, and the draft calls into
 * saved splits when persisting a result.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SavedSplitsProvider>
        <SplitDraftProvider>{children}</SplitDraftProvider>
      </SavedSplitsProvider>
    </AuthProvider>
  );
}
