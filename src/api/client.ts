import type { AuthTokensResponse, StoredSession, User } from "@/types";

const STORAGE_KEYS = {
  AUTH: "fiszki_auth_session_v1",
} as const;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function saveStoredSession(
  resp:
    | AuthTokensResponse
    | {
        user: User;
        access_token?: string;
        expires_at?: string;
        refresh_token?: string;
      }
): StoredSession {
  const session: StoredSession = {
    user: resp.user,
    accessToken: resp.access_token || undefined,
    expiresAt: resp.expires_at || undefined,
    refreshToken: resp.refresh_token || undefined,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
  }
  return session;
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

// Single-flight lock for refresh token rotation
let inflightRefresh: Promise<StoredSession | null> | null = null;

export async function performTokenRefresh(): Promise<StoredSession | null> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    try {
      const current = getStoredSession();
      // With HttpOnly cookies, browser attaches `Cookie: refresh_token=...` automatically.
      // Also send JSON body if available in storage for maximum compatibility.
      const body = current?.refreshToken
        ? JSON.stringify({ refresh_token: current.refreshToken })
        : undefined;

      const res = await fetch("/api/proxy/api/v1/auth/refresh", {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
        credentials: "same-origin",
      });

      if (!res.ok) {
        clearStoredSession();
        return null;
      }

      const data = (await res.json()) as AuthTokensResponse;
      return saveStoredSession(data);
    } catch {
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session || !session.accessToken) return null;

  if (session.expiresAt) {
    const expiresMs = new Date(session.expiresAt).getTime();
    const nowMs = Date.now();
    // Refresh proactively if within 45 seconds of expiration
    if (!Number.isNaN(expiresMs) && expiresMs - nowMs < 45_000) {
      const refreshed = await performTokenRefresh();
      return refreshed?.accessToken ?? null;
    }
  }
  return session.accessToken;
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Attach stored Bearer token as fallback when present; otherwise rely on HttpOnly cookie
  const token = await getValidAccessToken();
  if (token && requireAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (res.status === 401 && requireAuth) {
    const refreshed = await performTokenRefresh();
    if (refreshed) {
      if (refreshed.accessToken) {
        headers["Authorization"] = `Bearer ${refreshed.accessToken}`;
      }
      res = await fetch(`/api/proxy${path}`, {
        ...options,
        headers,
        credentials: "same-origin",
      });
    }
  }

  return res;
}

async function parseErrorResponse(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const errJson = (await res.json()) as { error?: string };
      if (errJson.error) return errJson.error;
    } catch {
      // ignore parse error
    }
    return `HTTP ${res.status}`;
  }

  const text = (await res.text()).trim();
  const looksLikeHtml = /^<!doctype|^<html|<\/html>/i.test(text);
  if (looksLikeHtml) {
    return `HTTP ${res.status} — server unavailable, try again in a moment`;
  }
  return text ? text.slice(0, 300) : `HTTP ${res.status}`;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const res = await fetchWithAuth(path, options, requireAuth);

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw new ApiError(await parseErrorResponse(res), res.status);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export async function requestBlob(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<Blob> {
  const res = await fetchWithAuth(path, options, requireAuth);
  if (!res.ok) {
    throw new ApiError(`Export failed (${res.status})`, res.status);
  }
  return res.blob();
}
