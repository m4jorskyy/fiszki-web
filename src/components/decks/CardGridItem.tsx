"use client";

import React from "react";
import type { Card } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface CardGridItemProps {
  card: Card;
  onSelect: (card: Card) => void;
}

export function CardGridItem({ card, onSelect }: CardGridItemProps) {
  const { t } = usePreferences();

  return (
    <div
      onClick={() => onSelect(card)}
      className="index-card p-4 hover:border-[var(--border-strong)] cursor-pointer transition-colors flex flex-col justify-between gap-3"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono-tabular">
          <span className="px-2 py-0.5 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] text-[var(--ink-secondary)]">
            {t.ledger.states[card.state] || card.state}
          </span>
          <span className="text-[var(--ink-muted)]">
            {card.interval_days}d · EF {card.ease_factor.toFixed(2)}
          </span>
        </div>

        <p className="font-serif-card font-semibold text-base text-[var(--ink-primary)] line-clamp-2">
          {card.front}
        </p>
        <p className="font-serif-card text-sm text-[var(--ink-secondary)] mt-1 line-clamp-2">
          {card.back}
        </p>
      </div>

      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--border-paper)]">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-[var(--bg-recessed)] text-[11px] text-[var(--ink-secondary)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
