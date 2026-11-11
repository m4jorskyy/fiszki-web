import {
  AuthTokensResponse,
  Card,
  CardFilter,
  CardInput,
  Deck,
  DueCardsFilter,
  ExtractedCardCandidate,
  Rating,
  ReviewLog,
  StudyStatsOverview,
  User,
} from "./types";

const STORAGE_KEYS = {
  AUTH: "fiszki_auth_session_v1",
} as const;

export interface StoredSession {
  user: User;
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
}

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

export function saveStoredSession(resp: AuthTokensResponse): StoredSession {
  const session: StoredSession = {
    user: resp.user,
    accessToken: resp.access_token,
    expiresAt: resp.expires_at,
    refreshToken: resp.refresh_token,
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

// Single-flight lock for refresh token rotation (ConsumeRefreshToken is one-time use in fiszki-server)
let inflightRefresh: Promise<StoredSession | null> | null = null;

async function performTokenRefresh(): Promise<StoredSession | null> {
  if (inflightRefresh) return inflightRefresh;

  const current = getStoredSession();
  if (!current?.refreshToken) return null;

  inflightRefresh = (async () => {
    try {
      const res = await fetch("/api/proxy/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
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

async function getValidAccessToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;

  const expiresMs = new Date(session.expiresAt).getTime();
  const nowMs = Date.now();
  // Refresh proactively if within 45 seconds of expiration
  if (!Number.isNaN(expiresMs) && expiresMs - nowMs < 45_000) {
    const refreshed = await performTokenRefresh();
    return refreshed?.accessToken ?? null;
  }
  return session.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (requireAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && requireAuth) {
    const refreshed = await performTokenRefresh();
    if (refreshed?.accessToken) {
      headers["Authorization"] = `Bearer ${refreshed.accessToken}`;
      res = await fetch(`/api/proxy${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    if (contentType.includes("application/json")) {
      try {
        const errJson = (await res.json()) as { error?: string };
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // ignore parse error
      }
    } else {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new ApiError(errMsg, res.status);
  }

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export const fiszkiApi = {
  // 1. Auth: POST /api/v1/auth/register
  async register(email: string, password: string): Promise<StoredSession> {
    const resp = await request<AuthTokensResponse>(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
      false
    );
    return saveStoredSession(resp);
  },

  // 2. Auth: POST /api/v1/auth/login
  async login(email: string, password: string): Promise<StoredSession> {
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
  },

  // 3. Auth: POST /api/v1/auth/refresh
  async refresh(): Promise<StoredSession | null> {
    return performTokenRefresh();
  },

  // 4. Auth: POST /api/v1/auth/logout
  async logout(): Promise<void> {
    const session = getStoredSession();
    try {
      if (session?.refreshToken) {
        await request<void>(
          "/api/v1/auth/logout",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: session.refreshToken }),
          },
          false
        );
      }
    } finally {
      clearStoredSession();
    }
  },

  // 5. Auth: GET /api/v1/auth/me
  async getMe(): Promise<User> {
    return request<User>("/api/v1/auth/me");
  },

  // 6. Decks: GET /api/v1/decks
  async listDecks(): Promise<Deck[]> {
    const res = await request<{ decks: Deck[] | null }>("/api/v1/decks");
    return res.decks ?? [];
  },

  // 7. Decks: POST /api/v1/decks
  async createDeck(name: string, description: string): Promise<Deck> {
    return request<Deck>("/api/v1/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
  },

  // 8. Decks: GET /api/v1/decks/{deckID}
  async getDeck(deckID: string): Promise<Deck> {
    return request<Deck>(`/api/v1/decks/${encodeURIComponent(deckID)}`);
  },

  // 9. Decks: PUT /api/v1/decks/{deckID}
  async updateDeck(
    deckID: string,
    name: string,
    description: string
  ): Promise<Deck> {
    return request<Deck>(`/api/v1/decks/${encodeURIComponent(deckID)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
  },

  // 10. Decks: DELETE /api/v1/decks/{deckID}
  async deleteDeck(deckID: string): Promise<void> {
    return request<void>(`/api/v1/decks/${encodeURIComponent(deckID)}`, {
      method: "DELETE",
    });
  },

  // 11. Decks: GET /api/v1/decks/{deckID}/export?format=csv|json
  async exportDeck(
    deckID: string,
    deckName: string,
    format: "csv" | "json"
  ): Promise<void> {
    const token = await getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `/api/proxy/api/v1/decks/${encodeURIComponent(deckID)}/export?format=${format}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!res.ok) {
      throw new ApiError(`Export failed (${res.status})`, res.status);
    }

    const blob = await res.blob();
    const safeName =
      deckName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-_ ]/g, "")
        .replace(/\s+/g, "-") || "deck";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // 12. Decks: POST /api/v1/decks/{deckID}/import?format=csv|json
  async importDeck(
    deckID: string,
    format: "csv" | "json",
    rawContent: string
  ): Promise<{ imported_count: number; cards: Card[] }> {
    const contentType =
      format === "csv" ? "text/csv; charset=utf-8" : "application/json";
    return request<{ imported_count: number; cards: Card[] }>(
      `/api/v1/decks/${encodeURIComponent(deckID)}/import?format=${format}`,
      {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: rawContent,
      }
    );
  },

  // 13. Cards: GET /api/v1/decks/{deckID}/cards
  async listCards(deckID: string, filter: CardFilter = {}): Promise<Card[]> {
    const params = new URLSearchParams();
    if (filter.q) params.set("q", filter.q);
    if (filter.tag) params.set("tag", filter.tag);
    if (filter.state) params.set("state", filter.state);
    const qs = params.toString() ? `?${params.toString()}` : "";

    const res = await request<{ cards: Card[] | null }>(
      `/api/v1/decks/${encodeURIComponent(deckID)}/cards${qs}`
    );
    return res.cards ?? [];
  },

  // 14. Cards: POST /api/v1/decks/{deckID}/cards
  async createCard(deckID: string, input: CardInput): Promise<Card> {
    return request<Card>(
      `/api/v1/decks/${encodeURIComponent(deckID)}/cards`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
  },

  // 15. Cards: POST /api/v1/decks/{deckID}/cards/bulk
  async bulkCreateCards(
    deckID: string,
    cards: CardInput[]
  ): Promise<{ created_count: number; cards: Card[] }> {
    return request<{ created_count: number; cards: Card[] }>(
      `/api/v1/decks/${encodeURIComponent(deckID)}/cards/bulk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      }
    );
  },

  // 16. Cards: POST /api/v1/cards/extract-from-photo
  async extractFromPhoto(
    file: File
  ): Promise<{ count: number; cards: ExtractedCardCandidate[] }> {
    const formData = new FormData();
    formData.append("image", file);

    const res = await request<{
      count: number;
      cards: ExtractedCardCandidate[] | null;
    }>("/api/v1/cards/extract-from-photo", {
      method: "POST",
      body: formData,
    });

    return {
      count: res.count ?? 0,
      cards: res.cards ?? [],
    };
  },

  // 17. Cards: GET /api/v1/cards/{cardID}
  async getCard(cardID: string): Promise<Card> {
    return request<Card>(`/api/v1/cards/${encodeURIComponent(cardID)}`);
  },

  // 18. Cards: PUT /api/v1/cards/{cardID}
  async updateCard(cardID: string, input: CardInput): Promise<Card> {
    return request<Card>(`/api/v1/cards/${encodeURIComponent(cardID)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // 19. Cards: DELETE /api/v1/cards/{cardID}
  async deleteCard(cardID: string): Promise<void> {
    return request<void>(`/api/v1/cards/${encodeURIComponent(cardID)}`, {
      method: "DELETE",
    });
  },

  // 20. Study: GET /api/v1/study/due
  async getDueCards(
    filter: DueCardsFilter = {}
  ): Promise<{ count: number; cards: Card[] }> {
    const params = new URLSearchParams();
    if (filter.deck_id) params.set("deck_id", filter.deck_id);
    if (filter.tag) params.set("tag", filter.tag);
    if (filter.limit) params.set("limit", String(filter.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";

    const res = await request<{ count: number; cards: Card[] | null }>(
      `/api/v1/study/due${qs}`
    );
    return {
      count: res.count ?? 0,
      cards: res.cards ?? [],
    };
  },

  // 21. Study: POST /api/v1/study/cards/{cardID}/review
  async submitReview(
    cardID: string,
    rating: Rating
  ): Promise<{ card: Card; review_log: ReviewLog }> {
    return request<{ card: Card; review_log: ReviewLog }>(
      `/api/v1/study/cards/${encodeURIComponent(cardID)}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      }
    );
  },

  // 22. Stats: GET /api/v1/stats/overview
  async getStatsOverview(): Promise<StudyStatsOverview> {
    return request<StudyStatsOverview>("/api/v1/stats/overview");
  },
};
