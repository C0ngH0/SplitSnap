import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  deleteSplitSession,
  getSavedSplitSessions,
  saveSplitSession,
} from "../services/splitStorage";
import type { SplitSession } from "../types/split";
import { useAuth } from "./AuthContext";

type SavedSplitsContextValue = {
  sessions: SplitSession[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Persists a split and returns the server copy, whose id is a real UUID. */
  save: (session: SplitSession) => Promise<SplitSession>;
  remove: (sessionId: string) => Promise<void>;
  clearError: () => void;
};

const SavedSplitsContext = createContext<SavedSplitsContextValue | null>(null);

export function SavedSplitsProvider({ children }: { children: ReactNode }) {
  const { authToken, isAuthReady } = useAuth();
  const [sessions, setSessions] = useState<SplitSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) {
      setSessions([]);
      return;
    }

    try {
      setIsLoading(true);
      setSessions(await getSavedSplitSessions());
      setError(null);
    } catch (refreshError) {
      console.error("[splitHistory] Failed to load splits:", refreshError);
      setError("Could not load saved splits.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (authToken) {
      void refresh();
    } else {
      setSessions([]);
    }
  }, [authToken, isAuthReady, refresh]);

  const save = useCallback(
    async (session: SplitSession) => {
      const savedSession = await saveSplitSession(session);
      setSessions(await getSavedSplitSessions());
      setError(null);
      return savedSession;
    },
    [],
  );

  const remove = useCallback(
    async (sessionId: string) => {
      await deleteSplitSession(sessionId);
      await refresh();
    },
    [refresh],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SavedSplitsContextValue>(
    () => ({ sessions, isLoading, error, refresh, save, remove, clearError }),
    [sessions, isLoading, error, refresh, save, remove, clearError],
  );

  return (
    <SavedSplitsContext.Provider value={value}>
      {children}
    </SavedSplitsContext.Provider>
  );
}

export function useSavedSplits() {
  const context = useContext(SavedSplitsContext);

  if (!context) {
    throw new Error("useSavedSplits must be used within a SavedSplitsProvider.");
  }

  return context;
}
