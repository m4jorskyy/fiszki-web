"use client";

import React from "react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface StudyFilterTrayProps {
  decks: Deck[];
  selectedDeckId: string;
  selectedTag: string;
  limit: number;
  onDeckChange: (deckId: string) => void;
  onTagChange: (tag: string) => void;
  onLimitChange: (limit: number) => void;
}

export function StudyFilterTray({
  decks,
  selectedDeckId,
  selectedTag,
  limit,
  onDeckChange,
  onTagChange,
  onLimitChange,
}: StudyFilterTrayProps) {
  const { t } = usePreferences();

  return (
    <div className="index-card p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
          {t.study.filterDeck}
        </label>
        <select
          value={selectedDeckId}
          onChange={(e) => onDeckChange(e.target.value)}
          className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
        >
          <option value="">{t.study.allDecks}</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.counts.due_cards} due / {d.counts.total_cards})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
          {t.study.filterTag}
        </label>
        <input
          type="text"
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
          placeholder="np. rozdział-1"
          className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
          {t.study.filterLimit}
        </label>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm font-mono-tabular"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
