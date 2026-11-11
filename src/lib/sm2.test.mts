import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { previewSchedule, DEFAULT_EASE_FACTOR, MIN_EASE_FACTOR } from "./sm2.ts";
import {
  RATING_AGAIN,
  RATING_EASY,
  RATING_GOOD,
  RATING_HARD,
} from "./types.ts";

describe("SM-2 previewSchedule parity with fiszki-server", () => {
  it("matches TestSchedule_NewToReviewLifecycle", () => {
    let card = {
      state: "new" as const,
      step: 0,
      interval_days: 0,
      ease_factor: DEFAULT_EASE_FACTOR,
      repetitions: 0,
      lapses: 0,
    };

    // Step 1: Good on new card -> learning step 1 (10m)
    const res1 = previewSchedule(card, RATING_GOOD);
    assert.equal(res1.state, "learning");
    assert.equal(res1.step, 1);
    assert.equal(res1.label, "10m");

    // Step 2: Good on learning step 1 -> review (1d)
    card = {
      ...card,
      state: res1.state,
      step: res1.step,
    };
    const res2 = previewSchedule(card, RATING_GOOD);
    assert.equal(res2.state, "review");
    assert.equal(res2.intervalDays, 1);
    assert.equal(res2.repetitions, 1);
    assert.equal(res2.label, "1d");

    // Step 3: Good on first review -> 6d
    card = {
      ...card,
      state: res2.state,
      interval_days: res2.intervalDays,
      repetitions: res2.repetitions,
    };
    const res3 = previewSchedule(card, RATING_GOOD);
    assert.equal(res3.intervalDays, 6);
    assert.equal(res3.repetitions, 2);
    assert.equal(res3.label, "6d");

    // Step 4: Good on second review -> round(6 * 2.5) = 15d
    card = {
      ...card,
      interval_days: res3.intervalDays,
      repetitions: res3.repetitions,
    };
    const res4 = previewSchedule(card, RATING_GOOD);
    assert.equal(res4.intervalDays, 15);
    assert.equal(res4.repetitions, 3);
    assert.equal(res4.label, "15d");

    // Step 5: Again on review -> relearning (10m), lapses=1, ef=2.3
    card = {
      ...card,
      interval_days: res4.intervalDays,
      repetitions: res4.repetitions,
    };
    const res5 = previewSchedule(card, RATING_AGAIN);
    assert.equal(res5.state, "relearning");
    assert.equal(res5.lapses, 1);
    assert.equal(res5.easeFactor, 2.3);
    assert.equal(res5.label, "10m");

    // Step 6: Good on relearning -> review (1d)
    card = {
      ...card,
      state: res5.state,
      lapses: res5.lapses,
      ease_factor: res5.easeFactor,
      interval_days: res5.intervalDays,
    };
    const res6 = previewSchedule(card, RATING_GOOD);
    assert.equal(res6.state, "review");
    assert.equal(res6.intervalDays, 1);
    assert.equal(res6.label, "1d");
  });

  it("matches all state and rating branches & ease factor floor", () => {
    const reviewCard = {
      state: "review" as const,
      step: 0,
      interval_days: 10,
      ease_factor: 2.5,
      repetitions: 2,
      lapses: 0,
    };
    const hard = previewSchedule(reviewCard, RATING_HARD);
    assert.equal(hard.intervalDays, 12);
    assert.equal(hard.easeFactor, 2.35);

    const easy = previewSchedule(reviewCard, RATING_EASY);
    assert.equal(easy.intervalDays, 33);
    assert.equal(easy.easeFactor, 2.65);

    const floorCard = {
      ...reviewCard,
      ease_factor: 1.35,
    };
    const floored = previewSchedule(floorCard, RATING_AGAIN);
    assert.equal(floored.easeFactor, MIN_EASE_FACTOR);
  });
});
