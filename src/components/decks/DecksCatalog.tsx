"use client";

import React, { useState } from "react";
import { Camera, Plus } from "lucide-react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { CreateDeckForm } from "./CreateDeckForm";
import { DeckCard } from "./DeckCard";

interface DecksCatalogProps {
  decks: Deck[];
  loading: boolean;
  onOpenDeck: (deckId: string) => void;
  onCreateDeck: (name: string, description: string) => Promise<void>;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deck: Deck) => void;
  onStartStudy: (deckId: string, mode: "due" | "practice") => void;
  onOpenScan: () => void;
}

export function DecksCatalog({
  decks,
  loading,
  onOpenDeck,
  onCreateDeck,
  onEditDeck,
  onDeleteDeck,
  onStartStudy,
  onOpenScan,
}: DecksCatalogProps) {
  const { t } = usePreferences();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif-card text-xl sm:text-2xl font-semibold">
          {t.decks.title}
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateDeck((s) => !s)}
          className="min-h-[42px] px-4 py-2 rounded bg-[var(--ink-primary)] text-[var(--bg-card)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.decks.newDeck}</span>
        </button>
      </div>

      {showCreateDeck && (
        <CreateDeckForm
          onCreate={async (name, desc) => {
            await onCreateDeck(name, desc);
            setShowCreateDeck(false);
          }}
          onCancel={() => setShowCreateDeck(false)}
        />
      )}

      {loading && decks.length === 0 ? (
        <div className="index-card p-10 text-center text-sm text-[var(--ink-muted)]">
          {t.common.loading}
        </div>
      ) : decks.length === 0 ? (
        <div className="index-stack p-8 text-center max-w-md mx-auto">
          <h3 className="font-serif-card text-xl font-semibold mb-1">
            {t.decks.emptyTitle}
          </h3>
          <p className="text-sm text-[var(--ink-secondary)] mb-5">
            {t.decks.emptyDesc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCreateDeck(true)}
              className="min-h-[46px] px-4 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.decks.newDeck}</span>
            </button>
            <button
              type="button"
              onClick={onOpenScan}
              className="min-h-[46px] px-4 py-2 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-[var(--accent-cobalt)]" />
              <span>{t.nav.scan}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map((d) => (
            <DeckCard
              key={d.id}
              deck={d}
              menuOpen={openMenuDeckId === d.id}
              onToggleMenu={() =>
                setOpenMenuDeckId((cur) => (cur === d.id ? null : d.id))
              }
              onCloseMenu={() => setOpenMenuDeckId(null)}
              onOpen={onOpenDeck}
              onEdit={onEditDeck}
              onDelete={onDeleteDeck}
              onStartStudy={onStartStudy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
