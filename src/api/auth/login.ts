import type { AuthTokensResponse, StoredSession } from "@/types";
import { request, saveStoredSession } from "../client";

export async function login(
  email: string,
  password: string
): Promise<StoredSession> {
  const resp = await request<AuthTokensResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    false
  );
  return saveStoredSession(resp);
}
