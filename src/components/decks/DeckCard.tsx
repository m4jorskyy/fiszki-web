"use client";

import React from "react";
import { Play, Sparkles } from "lucide-react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { DeckMenu } from "@/components/ui/DeckMenu";

interface DeckCardProps {
  deck: Deck;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpen: (deckId: string) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
  onStartStudy: (deckId: string, mode: "due" | "practice") => void;
}

export function DeckCard({
  deck,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onEdit,
  onDelete,
  onStartStudy,
}: DeckCardProps) {
  const { t } = usePreferences();

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(deck.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(deck.id);
        }
      }}
      className="index-stack p-5 flex flex-col justify-between gap-4 hover:border-[var(--accent-cobalt)] transition-colors relative cursor-pointer group"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif-card text-xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-cobalt)] transition-colors">
            {deck.name}
          </h3>

          <DeckMenu
            open={menuOpen}
            onToggle={onToggleMenu}
            onClose={onCloseMenu}
            onEdit={() => onEdit(deck)}
            onDelete={() => onDelete(deck)}
          />
        </div>

        {deck.description && (
          <p className="text-sm text-[var(--ink-secondary)] mt-1 line-clamp-2">
            {deck.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-mono-tabular">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-recessed)] border border-[var(--border-paper)] text-[var(--ink-primary)] font-semibold">
            {deck.counts.total_cards} {t.decks.cardsTotal}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-semibold ${
              deck.counts.due_cards > 0
                ? "bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)]"
                : "bg-[var(--bg-recessed)] text-[var(--ink-muted)]"
            }`}
          >
            {deck.counts.due_cards} {t.decks.dueBadge}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)]">
            {deck.counts.new_cards} {t.decks.newBadge}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--amber-hard-soft)] text-[var(--amber-hard)]">
            {deck.counts.learning_cards} {t.decks.learningBadge}
          </span>
        </div>
      </div>

      <div
        className="pt-3 border-t border-[var(--border-paper)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            onStartStudy(
              deck.id,
              deck.counts.due_cards > 0 ? "due" : "practice"
            )
          }
          className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-[var(--accent-cobalt)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {deck.counts.due_cards > 0 ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {t.decks.studyDeck} ({deck.counts.due_cards})
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.decks.practiceDeck}</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
