import type { Card, CardState, Rating } from "./types";

const RATING_AGAIN: Rating = 1;
const RATING_HARD: Rating = 2;
const RATING_GOOD: Rating = 3;
const RATING_EASY: Rating = 4;

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

export interface SchedulePreview {
  state: CardState;
  step: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  label: string;
}

/**
 * Exact TypeScript port of fiszki-server/internal/srs/sm2.go Schedule()
 * so the study UI shows the exact interval that the Go backend will assign.
 */
export function previewSchedule(
  card: Pick<
    Card,
    "state" | "step" | "interval_days" | "ease_factor" | "repetitions" | "lapses"
  >,
  rating: Rating,
  locale: "pl" | "en" = "pl"
): SchedulePreview {
  let ef = card.ease_factor;
  if (!ef || ef < MIN_EASE_FACTOR) {
    ef = DEFAULT_EASE_FACTOR;
  }

  let state: CardState = card.state || "new";
  let step = card.step ?? 0;
  let intervalDays = card.interval_days ?? 0;
  let repetitions = card.repetitions ?? 0;
  let lapses = card.lapses ?? 0;
  let minutesDelta: number | null = null;

  switch (state) {
    case "new":
    case "learning": {
      switch (rating) {
        case RATING_AGAIN:
          state = "learning";
          step = 0;
          minutesDelta = 1;
          break;
        case RATING_HARD:
          state = "learning";
          minutesDelta = 6;
          break;
        case RATING_GOOD:
          if (card.step === 0) {
            state = "learning";
            step = 1;
            minutesDelta = 10;
          } else {
            state = "review";
            step = 0;
            repetitions = 1;
            intervalDays = 1;
          }
          break;
        case RATING_EASY:
          state = "review";
          step = 0;
          repetitions = 1;
          intervalDays = 4;
          break;
      }
      break;
    }

    case "review": {
      const curInterval = Math.max(1, card.interval_days || 1);
      switch (rating) {
        case RATING_AGAIN:
          state = "relearning";
          step = 0;
          lapses = (card.lapses || 0) + 1;
          repetitions = 0;
          ef = Math.max(MIN_EASE_FACTOR, ef - 0.2);
          intervalDays = 1;
          minutesDelta = 10;
          break;
        case RATING_HARD: {
          state = "review";
          ef = Math.max(MIN_EASE_FACTOR, ef - 0.15);
          const nextInterval = Math.round(curInterval * 1.2);
          intervalDays = Math.max(curInterval + 1, nextInterval);
          repetitions = (card.repetitions || 0) + 1;
          break;
        }
        case RATING_GOOD: {
          state = "review";
          if ((card.repetitions || 0) <= 1) {
            intervalDays = Math.max(curInterval + 1, 6);
          } else {
            const nextInterval = Math.round(curInterval * ef);
            intervalDays = Math.max(curInterval + 1, nextInterval);
          }
          repetitions = (card.repetitions || 0) + 1;
          break;
        }
        case RATING_EASY: {
          state = "review";
          const nextInterval = Math.round(curInterval * ef * 1.3);
          ef = ef + 0.15;
          intervalDays = Math.max(curInterval + 1, nextInterval);
          repetitions = (card.repetitions || 0) + 1;
          break;
        }
      }
      break;
    }

    case "relearning": {
      switch (rating) {
        case RATING_AGAIN:
          state = "relearning";
          step = 0;
          minutesDelta = 1;
          break;
        case RATING_HARD:
          state = "relearning";
          minutesDelta = 6;
          break;
        case RATING_GOOD:
          state = "review";
          step = 0;
          repetitions = 1;
          intervalDays = Math.max(1, card.interval_days || 1);
          break;
        case RATING_EASY:
          state = "review";
          step = 0;
          repetitions = 1;
          intervalDays = Math.max(2, (card.interval_days || 0) + 1);
          break;
      }
      break;
    }
  }

  const roundedEf = Math.round(ef * 100) / 100;
  const dayUnit = locale === "pl" ? "d" : "d";
  const label =
    minutesDelta !== null
      ? `${minutesDelta}m`
      : `${intervalDays}${dayUnit}`;

  return {
    state,
    step,
    intervalDays,
    easeFactor: roundedEf,
    repetitions,
    lapses,
    label,
  };
}
