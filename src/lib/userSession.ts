import { api } from "./api";
import { readJson } from "./localData";

export type StoredUser = {
  userId: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
};

export const USER_KEY = "smarm_user";
export const LOGGED_OUT_KEY = "smarm_logged_out";

// Device preferences that must survive logout and account switches.
const DEVICE_KEYS = new Set(["smarm_test_music_muted"]);

export function readStoredUser(): StoredUser | null {
  const user = readJson<StoredUser | null>(USER_KEY, null);
  if (!user || typeof user !== "object") return null;
  const userId =
    typeof user.userId === "string"
      ? user.userId
      : typeof user.id === "string"
        ? user.id
        : "";
  if (!userId) return null;
  return { ...user, userId };
}

export function writeStoredUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedOut(): boolean {
  try {
    return localStorage.getItem(LOGGED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLoggedOut() {
  try {
    localStorage.setItem(LOGGED_OUT_KEY, "1");
  } catch {
    /* ignore quota errors */
  }
}

export function clearLoggedOutFlag() {
  try {
    localStorage.removeItem(LOGGED_OUT_KEY);
  } catch {
    /* ignore quota errors */
  }
}

/** Removes every account-scoped key, keeping only device preferences. */
export function clearAccountData() {
  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith("smarm_") && !DEVICE_KEYS.has(key)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export async function loadRemoteData(): Promise<Record<string, unknown> | null> {
  try {
    const response = await api.loadData();
    if (!response || response.status !== "success") return null;
    let data = response.userData;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return null;
      }
    }
    if (!data || typeof data !== "object") return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function applyRemoteData(data: Record<string, unknown> | null) {
  if (!data) return;
  Object.entries(data).forEach(([key, value]) => {
    if (!key.startsWith("smarm_")) return;
    if (key === USER_KEY || key === LOGGED_OUT_KEY || DEVICE_KEYS.has(key)) return;
    if (value === undefined || value === null) return;
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  });
}

/** Replaces whatever is on this device with the given account and its server data. */
export function adoptUser(user: StoredUser, remoteData: Record<string, unknown> | null) {
  clearAccountData();
  writeStoredUser(user);
  clearLoggedOutFlag();
  applyRemoteData(remoteData);
}

export type SessionCheck = "ok" | "switched" | "unauthenticated" | "offline";

/**
 * Confirms the cookie session and the locally stored account are the same user.
 * When another account owns the session, this device is wiped and refilled with
 * that account's server data so no stale data leaks between accounts.
 */
export async function ensureSessionUser(): Promise<SessionCheck> {
  let session: any;
  try {
    session = await api.session();
  } catch {
    return "offline";
  }

  if (!session || session.status === "error" || !session.user) {
    if (session?.httpStatus === 401) {
      clearAccountData();
      return "unauthenticated";
    }
    return "offline";
  }

  const serverUser = session.user as StoredUser;
  const stored = readStoredUser();
  if (stored?.userId === serverUser.userId) {
    clearLoggedOutFlag();
    return "ok";
  }

  const remote = await loadRemoteData();
  adoptUser(serverUser, remote);
  return "switched";
}
