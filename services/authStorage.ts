import * as SecureStore from "expo-secure-store";

// SecureStore only accepts alphanumerics, ".", "-" and "_", so these keys
// must stay free of separators like ":". The same keys are used for the web
// localStorage path to keep both platforms consistent.
const AUTH_TOKEN_KEY = "tably.auth_token";
const GUEST_MODE_KEY = "tably.guest_mode";

let memoryToken: string | null = null;
let memoryGuestMode = false;

function getLocalStorage(): Storage | null {
  if (
    typeof globalThis !== "undefined" &&
    "localStorage" in globalThis &&
    globalThis.localStorage
  ) {
    return globalThis.localStorage;
  }

  return null;
}

export async function getStoredAuthToken(): Promise<string | null> {
  const storage = getLocalStorage();
  if (storage) {
    return storage.getItem(AUTH_TOKEN_KEY);
  }

  try {
    const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (storedToken !== null) {
      memoryToken = storedToken;
    }
    return storedToken;
  } catch (error) {
    console.error("[authStorage] Failed to read auth token:", error);
    return memoryToken;
  }
}

export async function storeAuthToken(token: string): Promise<void> {
  memoryToken = token;

  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error("[authStorage] Failed to persist auth token:", error);
  }
}

export async function clearAuthToken(): Promise<void> {
  memoryToken = null;

  const storage = getLocalStorage();
  if (storage) {
    storage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("[authStorage] Failed to clear auth token:", error);
  }
}

export async function getStoredGuestMode(): Promise<boolean> {
  const storage = getLocalStorage();
  if (storage) {
    return storage.getItem(GUEST_MODE_KEY) === "true";
  }

  try {
    return (await SecureStore.getItemAsync(GUEST_MODE_KEY)) === "true";
  } catch (error) {
    console.error("[authStorage] Failed to read guest mode:", error);
    return memoryGuestMode;
  }
}

export async function storeGuestMode(isGuest: boolean): Promise<void> {
  memoryGuestMode = isGuest;

  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(GUEST_MODE_KEY, isGuest ? "true" : "false");
    return;
  }

  try {
    await SecureStore.setItemAsync(GUEST_MODE_KEY, isGuest ? "true" : "false");
  } catch (error) {
    console.error("[authStorage] Failed to persist guest mode:", error);
  }
}
