import type { Card, CardInput } from "@/types";
import { request } from "../client";

export async function createCard(
  deckID: string,
  input: CardInput
): Promise<Card> {
  return request<Card>(
    `/api/v1/decks/${encodeURIComponent(deckID)}/cards`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
}
