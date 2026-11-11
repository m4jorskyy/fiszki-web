export type CardState = "new" | "learning" | "review" | "relearning";

export type Rating = 1 | 2 | 3 | 4;

export const RATING_AGAIN: Rating = 1;
export const RATING_HARD: Rating = 2;
export const RATING_GOOD: Rating = 3;
export const RATING_EASY: Rating = 4;

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokensResponse {
  user: User;
  access_token: string;
  expires_at: string;
  refresh_token: string;
}

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

export interface ExtractedCardCandidate {
  front: string;
  back: string;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  deck_id: string;
  user_id: string;
  rating: Rating;
  prev_state: CardState;
  new_state: CardState;
  prev_interval_days: number;
  new_interval_days: number;
  prev_ease_factor: number;
  new_ease_factor: number;
  reviewed_at: string;
}

export interface StudyStatsOverview {
  reviews_today: number;
  total_reviews: number;
  current_streak_days: number;
  retention_rate_percent: number;
  cards_by_state: Record<string, number>;
  due_now_count: number;
}

export interface CardFilter {
  q?: string;
  tag?: string;
  state?: CardState | "";
}

export interface DueCardsFilter {
  deck_id?: string;
  tag?: string;
  limit?: number;
}

export type BackendEnv = "staging" | "prod" | "custom";

export interface BackendConnectionConfig {
  env: BackendEnv;
  customUrl?: string;
}

export interface HealthStatus {
  status: "ok" | "db_unreachable" | "unreachable";
  env: BackendEnv;
  targetUrl: string;
  latencyMs?: number;
}
