import { clearStoredSession, getStoredSession } from "../client";

export async function logout(): Promise<void> {
  const session = getStoredSession();
  try {
    const body = session?.refreshToken
      ? JSON.stringify({ refresh_token: session.refreshToken })
      : undefined;

    await fetch("/api/proxy/api/v1/auth/logout", {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
      credentials: "same-origin",
    });
  } finally {
    clearStoredSession();
  }
}
