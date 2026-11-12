import type { BulkCreateCardsResponse, CardInput } from "@/types";
import { request } from "../client";

export async function bulkCreateCards(
  deckID: string,
  cards: CardInput[]
): Promise<BulkCreateCardsResponse> {
  return request<BulkCreateCardsResponse>(
    `/api/v1/decks/${encodeURIComponent(deckID)}/cards/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    }
  );
}
