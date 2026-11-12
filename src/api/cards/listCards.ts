import type { Card, CardFilter } from "@/types";
import { request } from "../client";

export async function listCards(
  deckID: string,
  filter: CardFilter = {}
): Promise<Card[]> {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.tag) params.set("tag", filter.tag);
  if (filter.state) params.set("state", filter.state);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const res = await request<{ cards: Card[] | null }>(
    `/api/v1/decks/${encodeURIComponent(deckID)}/cards${qs}`
  );
  return res.cards ?? [];
}
