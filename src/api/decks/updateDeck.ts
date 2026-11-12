import type { Deck } from "@/types";
import { request } from "../client";

export async function updateDeck(
  deckID: string,
  name: string,
  description: string
): Promise<Deck> {
  return request<Deck>(`/api/v1/decks/${encodeURIComponent(deckID)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}
