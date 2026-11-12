"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import type { Card } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface FlashcardFlipCardProps {
  card: Card;
  deckName: string;
  flipped: boolean;
  onToggleFlip: () => void;
}

export function FlashcardFlipCard({
  card,
  deckName,
  flipped,
  onToggleFlip,
}: FlashcardFlipCardProps) {
  const { t } = usePreferences();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? t.study.backSide : t.study.frontSide}
      onClick={onToggleFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleFlip();
        }
      }}
      className="card-flip-scene cursor-pointer select-none"
    >
      <div
        key={card.id}
        className={`card-flip-inner ${flipped ? "is-flipped" : ""}`}
      >
        {/* FRONT FACE (0deg) — Peony Pink Top Rule */}
        <div className="card-face card-face-front index-stack bristol-ruled crimson-top-rule p-5 sm:p-8">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)] text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-[var(--ink-secondary)] truncate">
                {deckName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-cobalt-soft)] border border-[var(--border-paper)] font-mono-tabular text-[var(--accent-cobalt)]">
                {t.ledger.states[card.state] || card.state}
              </span>
            </div>

            <span className="font-mono-tabular text-[var(--ink-muted)] shrink-0">
              EF {card.ease_factor.toFixed(2)} · {card.interval_days}d
            </span>
          </div>

          <div className="py-6 my-auto text-left overflow-y-auto">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)] text-xs font-semibold mb-3">
              {t.study.frontSide}
            </span>
            <p className="font-serif-card text-2xl sm:text-3xl md:text-4xl leading-snug text-[var(--ink-primary)] whitespace-pre-wrap max-w-[65ch]">
              {card.front}
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border-paper)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {card.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-[var(--accent-cobalt)] font-semibold flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              {t.study.tapToFlip}
            </span>
          </div>
        </div>

        {/* BACK FACE (180deg) — Electric Orchid Purple Top Rule */}
        <div className="card-face card-face-back index-stack bristol-ruled purple-top-rule p-5 sm:p-8">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)] text-xs">
            <span className="font-serif-card italic text-[var(--ink-secondary)] truncate max-w-[70%]">
              {card.front}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-semibold shrink-0">
              {t.study.backSide}
            </span>
          </div>

          <div className="py-6 my-auto text-left overflow-y-auto">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] text-xs font-semibold mb-3">
              {t.study.backSide}
            </span>
            <p className="font-serif-card text-xl sm:text-2xl md:text-3xl leading-relaxed text-[var(--ink-primary)] whitespace-pre-wrap max-w-[65ch]">
              {card.back}
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border-paper)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {card.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-[var(--ink-muted)] font-medium flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              {t.study.frontSide}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
