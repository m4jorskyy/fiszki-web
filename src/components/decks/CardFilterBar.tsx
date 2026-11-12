"use client";

import React from "react";
import { Search } from "lucide-react";
import type { CardState } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface CardFilterBarProps {
  searchQuery: string;
  stateFilter: CardState | "";
  tagFilter: string;
  availableTags: string[];
  onSearchChange: (q: string) => void;
  onStateChange: (state: CardState | "") => void;
  onTagChange: (tag: string) => void;
}

export function CardFilterBar({
  searchQuery,
  stateFilter,
  tagFilter,
  availableTags,
  onSearchChange,
  onStateChange,
  onTagChange,
}: CardFilterBarProps) {
  const { t } = usePreferences();

  return (
    <div className="index-card p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
      <div className="sm:col-span-6 relative">
        <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.cards.searchPlaceholder}
          className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
        />
      </div>

      <div className="sm:col-span-3">
        <select
          value={stateFilter}
          onChange={(e) => onStateChange(e.target.value as CardState | "")}
          className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
        >
          <option value="">{t.cards.allStates}</option>
          <option value="new">{t.ledger.states.new}</option>
          <option value="learning">{t.ledger.states.learning}</option>
          <option value="review">{t.ledger.states.review}</option>
          <option value="relearning">{t.ledger.states.relearning}</option>
        </select>
      </div>

      <div className="sm:col-span-3">
        <select
          value={tagFilter}
          onChange={(e) => onTagChange(e.target.value)}
          className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
        >
          <option value="">{t.cards.allTags}</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
