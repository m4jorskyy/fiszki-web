import type { Card, DueCardsFilter, DueCardsResponse } from "@/types";
import { request } from "../client";

export async function getDueCards(
  filter: DueCardsFilter = {}
): Promise<DueCardsResponse> {
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
}
