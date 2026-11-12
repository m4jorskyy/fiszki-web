import { request } from "../client";

export async function deleteDeck(deckID: string): Promise<void> {
  return request<void>(`/api/v1/decks/${encodeURIComponent(deckID)}`, {
    method: "DELETE",
  });
}
