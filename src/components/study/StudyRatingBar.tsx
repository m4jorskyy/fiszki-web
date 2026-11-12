"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Rating,
  RATING_AGAIN,
  RATING_EASY,
  RATING_GOOD,
  RATING_HARD,
  SchedulePreview,
} from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface StudyRatingBarProps {
  isSm2Mode: boolean;
  flipped: boolean;
  submitting: boolean;
  currentIndex: number;
  totalCards: number;
  previews: {
    again: SchedulePreview;
    hard: SchedulePreview;
    good: SchedulePreview;
    easy: SchedulePreview;
  } | null;
  onReveal: () => void;
  onToggleFlip: () => void;
  onRate: (rating: Rating) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StudyRatingBar({
  isSm2Mode,
  flipped,
  submitting,
  currentIndex,
  totalCards,
  previews,
  onReveal,
  onToggleFlip,
  onRate,
  onPrev,
  onNext,
}: StudyRatingBarProps) {
  const { t } = usePreferences();

  const ratingButtons: Array<{
    rating: Rating;
    keyNum: string;
    label: string;
    previewLabel?: string;
    borderClass: string;
    hoverBgClass: string;
    textClass: string;
  }> = [
    {
      rating: RATING_AGAIN,
      keyNum: "1",
      label: t.study.ratings.again,
      previewLabel: previews?.again.label,
      borderClass: "border-[var(--rule-crimson)]",
      hoverBgClass: "hover:bg-[var(--rule-crimson-soft)]",
      textClass: "text-[var(--rule-crimson)]",
    },
    {
      rating: RATING_HARD,
      keyNum: "2",
      label: t.study.ratings.hard,
      previewLabel: previews?.hard.label,
      borderClass: "border-[var(--amber-hard)]",
      hoverBgClass: "hover:bg-[var(--amber-hard-soft)]",
      textClass: "text-[var(--amber-hard)]",
    },
    {
      rating: RATING_GOOD,
      keyNum: "3",
      label: t.study.ratings.good,
      previewLabel: previews?.good.label,
      borderClass: "border-[var(--stamp-verdigris)]",
      hoverBgClass: "hover:bg-[var(--stamp-verdigris-soft)]",
      textClass: "text-[var(--stamp-verdigris)]",
    },
    {
      rating: RATING_EASY,
      keyNum: "4",
      label: t.study.ratings.easy,
      previewLabel: previews?.easy.label,
      borderClass: "border-[var(--accent-cobalt)]",
      hoverBgClass: "hover:bg-[var(--accent-cobalt-soft)]",
      textClass: "text-[var(--accent-cobalt)]",
    },
  ];

  return (
    <div className="sticky bottom-16 md:bottom-4 z-10 pt-2">
      {isSm2Mode ? (
        !flipped ? (
          <button
            type="button"
            onClick={onReveal}
            className="w-full min-h-[54px] rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-base shadow-md cursor-pointer"
          >
            {t.study.tapToFlip}
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {ratingButtons.map((btn) => (
              <button
                key={btn.keyNum}
                type="button"
                disabled={submitting}
                onClick={() => onRate(btn.rating)}
                className={`min-h-[60px] p-2 rounded-xl border-2 ${btn.borderClass} bg-[var(--bg-card)] ${btn.hoverBgClass} flex flex-col items-center justify-center transition-colors cursor-pointer`}
              >
                <span
                  className={`font-mono-tabular text-xs font-semibold ${btn.textClass}`}
                >
                  {btn.previewLabel}
                </span>
                <span className="text-sm font-bold text-[var(--ink-primary)]">
                  {btn.keyNum} · {btn.label}
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={onPrev}
            className="min-h-[52px] rounded-xl border border-[var(--border-paper)] bg-[var(--bg-card)] font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t.study.prevCard}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFlip}
            className="min-h-[52px] rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-sm"
          >
            {flipped ? t.study.frontSide : t.study.backSide}
          </button>

          <button
            type="button"
            disabled={currentIndex >= totalCards - 1}
            onClick={onNext}
            className="min-h-[52px] rounded-xl border border-[var(--border-paper)] bg-[var(--bg-card)] font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <span>{t.study.nextCard}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
