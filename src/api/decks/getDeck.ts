import type { Deck } from "@/types";
import { request } from "../client";

export async function getDeck(deckID: string): Promise<Deck> {
  return request<Deck>(`/api/v1/decks/${encodeURIComponent(deckID)}`);
}
