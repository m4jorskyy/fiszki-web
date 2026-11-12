import type { Deck } from "@/types";
import { request } from "../client";

export async function createDeck(
  name: string,
  description: string
): Promise<Deck> {
  return request<Deck>("/api/v1/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}
