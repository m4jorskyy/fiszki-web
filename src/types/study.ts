import type { Card, CardState } from "./card";

export type Rating = 1 | 2 | 3 | 4;

export const RATING_AGAIN: Rating = 1;
export const RATING_HARD: Rating = 2;
export const RATING_GOOD: Rating = 3;
export const RATING_EASY: Rating = 4;

export type StudyMode = "due" | "ahead" | "practice";

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

export interface DueCardsFilter {
  deck_id?: string;
  tag?: string;
  limit?: number;
}

export interface DueCardsResponse {
  count: number;
  cards: Card[];
}

export interface SubmitReviewResponse {
  card: Card;
  review_log: ReviewLog;
}

export interface SchedulePreview {
  state: CardState;
  step: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  label: string;
}
