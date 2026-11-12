import type { Deck } from "@/types";
import { request } from "../client";

export async function listDecks(): Promise<Deck[]> {
  const res = await request<{ decks: Deck[] | null }>("/api/v1/decks");
  return res.decks ?? [];
}
