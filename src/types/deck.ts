import type { Card } from "./card";

export interface DeckCounts {
  total_cards: number;
  new_cards: number;
  learning_cards: number;
  due_cards: number;
}

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string;
  counts: DeckCounts;
  created_at: string;
  updated_at: string;
}

export interface DeckPayload {
  name: string;
  description: string;
}

export type DeckExportFormat = "csv" | "json";

export interface ImportDeckResponse {
  imported_count: number;
  cards: Card[];
}
