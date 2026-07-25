import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginRequest,
  register as registerRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
  type AuthUser,
} from "../services/authApi";
import {
  clearAuthToken,
  clearAuthUser,
  getStoredAuthToken,
  getStoredAuthUser,
  getStoredGuestMode,
  storeAuthToken,
  storeAuthUser,
  storeGuestMode,
} from "../services/authStorage";

/** Guest Results → auth, then return to the same Results to save. */
export type PendingAuthAction = "returnToSaveSplit";

type AuthContextValue = {
  authToken: string | null;
  user: AuthUser | null;
  /** False until the persisted token has been read, so we can gate on a splash. */
  isAuthReady: boolean;
  isGuest: boolean;
  /** Set while a guest authenticates without leaving the New Split wizard. */
  pendingAuthAction: PendingAuthAction | null;
  isSubmitting: boolean;
  status: string | null;
  error: string | null;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  submitPasswordReset: (
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  /** Sends a guest back to the welcome screen so they can sign in. */
  exitGuest: () => Promise<void>;
  /**
   * Opens auth for saving a completed guest split without clearing guest mode
   * or resetting the draft. Cleared after a successful return to Results, or
   * if the user dismisses auth.
   */
  beginAuthForSaveSplit: () => void;
  clearPendingAuthAction: () => void;
  setStatus: (message: string | null) => void;
  setError: (message: string | null) => void;
  clearMessages: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] =
    useState<PendingAuthAction | null>(null);
  const pendingAuthActionRef = useRef(pendingAuthAction);
  pendingAuthActionRef.current = pendingAuthAction;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPersistedSession() {
      const [storedToken, storedUser, storedGuestMode] = await Promise.all([
        getStoredAuthToken(),
        getStoredAuthUser(),
        getStoredGuestMode(),
      ]);

      setAuthToken(storedToken);
      // Profile/home identity comes from user state; restore it with the token
      // so cold start does not leave a signed-in shell with a blank profile.
      setUser(storedToken ? storedUser : null);
      setIsGuest(storedGuestMode);
      setIsAuthReady(true);
    }

    void loadPersistedSession();
  }, []);

  const clearMessages = useCallback(() => {
    setStatus(null);
    setError(null);
  }, []);

  const handleAuthSuccess = useCallback(
    async (token: string, nextUser: AuthUser, message: string) => {
      await storeAuthToken(token);
      await storeAuthUser(nextUser);
      await storeGuestMode(false);
      setAuthToken(token);
      setUser(nextUser);
      setIsGuest(false);
      // Pending save-sign-in dismisses AuthModal immediately — skip the banner.
      setStatus(
        pendingAuthActionRef.current === "returnToSaveSplit" ? null : message,
      );
      setError(null);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      try {
        setIsSubmitting(true);
        const authResponse = await registerRequest(email, password);
        await handleAuthSuccess(
          authResponse.token,
          authResponse.user,
          "Registered and logged in.",
        );
        return true;
      } catch (registerError) {
        console.error("[auth] Registration failed:", registerError);
        setStatus(null);
        setError("Could not register. Check your email and password.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleAuthSuccess],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsSubmitting(true);
        const authResponse = await loginRequest(email, password);
        await handleAuthSuccess(
          authResponse.token,
          authResponse.user,
          "Logged in.",
        );
        return true;
      } catch (loginError) {
        console.error("[auth] Login failed:", loginError);
        setStatus(null);
        setError("Could not log in. Check your email and password.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
    await clearAuthToken();
    await clearAuthUser();
    await storeGuestMode(false);
    setAuthToken(null);
    setUser(null);
    setIsGuest(false);
    setPendingAuthAction(null);
    setStatus("Logged out.");
    setError(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setIsSubmitting(true);
      const response = await requestPasswordResetRequest(email);
      setStatus(response.message);
      setError(null);
      return true;
    } catch (resetError) {
      console.error("[auth] Forgot password request failed:", resetError);
      setStatus(null);
      setError("Could not request a password reset.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const submitPasswordReset = useCallback(
    async (
      email: string,
      code: string,
      newPassword: string,
      confirmPassword: string,
    ) => {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter the 6-digit reset code from your email.");
        return false;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return false;
      }

      try {
        setIsSubmitting(true);
        const response = await resetPasswordRequest(email, code, newPassword);
        setStatus(response.message);
        setError(null);
        return true;
      } catch (resetError) {
        console.error("[auth] Reset password failed:", resetError);
        setStatus(null);
        setError(
          resetError instanceof Error
            ? resetError.message
            : "Could not reset password. Check the code and new password.",
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const continueAsGuest = useCallback(async () => {
    await storeGuestMode(true);
    setIsGuest(true);
    setStatus(null);
    setError(null);
  }, []);

  const exitGuest = useCallback(async () => {
    await storeGuestMode(false);
    setIsGuest(false);
    setPendingAuthAction(null);
    setStatus(null);
    setError(null);
  }, []);

  const beginAuthForSaveSplit = useCallback(() => {
    setPendingAuthAction("returnToSaveSplit");
    setStatus(null);
    setError(null);
  }, []);

  const clearPendingAuthAction = useCallback(() => {
    setPendingAuthAction(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authToken,
      user,
      isAuthReady,
      isGuest,
      pendingAuthAction,
      isSubmitting,
      status,
      error,
      register,
      login,
      logout,
      requestPasswordReset,
      submitPasswordReset,
      continueAsGuest,
      exitGuest,
      beginAuthForSaveSplit,
      clearPendingAuthAction,
      setStatus,
      setError,
      clearMessages,
    }),
    [
      authToken,
      user,
      isAuthReady,
      isGuest,
      pendingAuthAction,
      isSubmitting,
      status,
      error,
      register,
      login,
      logout,
      requestPasswordReset,
      submitPasswordReset,
      continueAsGuest,
      exitGuest,
      beginAuthForSaveSplit,
      clearPendingAuthAction,
      clearMessages,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
