export type CardState = "new" | "learning" | "review" | "relearning";

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  tags: string[];
  state: CardState;
  step: number;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CardInput {
  front: string;
  back: string;
  tags?: string[];
}

export interface CardFilter {
  q?: string;
  tag?: string;
  state?: CardState | "";
}

export interface ExtractedCardCandidate {
  front: string;
  back: string;
}

export interface EditableCandidate extends ExtractedCardCandidate {
  id: string;
  selected: boolean;
}

export interface ExtractFromPhotoResponse {
  count: number;
  cards: ExtractedCardCandidate[];
}

export interface BulkCreateCardsResponse {
  created_count: number;
  cards: Card[];
}
