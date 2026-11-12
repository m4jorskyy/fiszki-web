"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Layers,
  Play,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { Alert } from "@/components/ui/Alert";
import { DeckMenu } from "@/components/ui/DeckMenu";
import { QuickAddCardForm } from "./QuickAddCardForm";
import { BulkAddCardsForm } from "./BulkAddCardsForm";
import { ImportExportPanel } from "./ImportExportPanel";
import { CardFilterBar } from "./CardFilterBar";
import { CardGridItem } from "./CardGridItem";
import { CardInspectorModal } from "./CardInspectorModal";

interface DeckDetailViewProps {
  deck: Deck;
  onBack: () => void;
  onStartStudy: (deckId: string, mode: "due" | "practice") => void;
  onOpenScanForDeck: (deckId: string) => void;
  onDeckUpdated: (updated: Deck) => void;
  onDeckDeleted: (deckId: string) => void;
  onDataChanged: () => void;
}

export function DeckDetailView({
  deck,
  onBack,
  onStartStudy,
  onOpenScanForDeck,
  onDeckUpdated,
  onDeckDeleted,
  onDataChanged,
}: DeckDetailViewProps) {
  const { t } = usePreferences();
  const {
    currentDeck,
    cards,
    loadingCards,
    error,
    toast,
    searchQuery,
    stateFilter,
    tagFilter,
    activeTool,
    inspectedCard,
    savingCardEdit,
    allTagsInView,
    setSearchQuery,
    setStateFilter,
    setTagFilter,
    setActiveTool,
    toggleTool,
    quickAddCard,
    bulkAddCards,
    importCards,
    exportCards,
    saveDeckEdit,
    removeDeck,
    openCardInspector,
    closeCardInspector,
    saveCardEdit,
    removeCard,
  } = useDeckDetail({
    deck,
    onDeckUpdated,
    onDeckDeleted,
    onDataChanged,
  });

  const [showDeckMenu, setShowDeckMenu] = useState(false);
  const [editDeckName, setEditDeckName] = useState(deck.name);
  const [editDeckDesc, setEditDeckDesc] = useState(deck.description);
  const [savingDeck, setSavingDeck] = useState(false);

  async function handleInlineDeckEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDeckName.trim() || savingDeck) return;
    setSavingDeck(true);
    try {
      await saveDeckEdit(editDeckName, editDeckDesc);
    } finally {
      setSavingDeck(false);
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="index-stack crimson-top-rule p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.common.back}</span>
          </button>

          <DeckMenu
            open={showDeckMenu}
            onToggle={() => setShowDeckMenu((prev) => !prev)}
            onClose={() => setShowDeckMenu(false)}
            onEdit={() => {
              setEditDeckName(currentDeck.name);
              setEditDeckDesc(currentDeck.description);
              toggleTool("editDeck");
            }}
            onDelete={() => void removeDeck()}
            buttonSizeClass="min-h-[38px] min-w-[38px] p-2"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-card text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)]">
              {currentDeck.name}
            </h1>
            {currentDeck.description && (
              <p className="text-sm text-[var(--ink-secondary)] mt-1">
                {currentDeck.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-mono-tabular">
              <span className="px-2.5 py-1 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
                <strong>{currentDeck.counts.total_cards}</strong>{" "}
                {t.decks.cardsTotal}
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--rule-crimson-soft)] text-[var(--rule-crimson)] font-semibold">
                {currentDeck.counts.due_cards} {t.decks.dueBadge}
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)]">
                {currentDeck.counts.new_cards} {t.decks.newBadge}
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--amber-hard-soft)] text-[var(--amber-hard)]">
                {currentDeck.counts.learning_cards} {t.decks.learningBadge}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onStartStudy(currentDeck.id, "due")}
              className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 rounded bg-[var(--accent-cobalt)] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {t.decks.studyDeck} ({currentDeck.counts.due_cards})
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStartStudy(currentDeck.id, "practice")}
              className="flex-1 sm:flex-initial min-h-[46px] px-3.5 py-2.5 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-cobalt)]" />
              <span>{t.decks.practiceDeck}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workbench Action Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => toggleTool("quick")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded border text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
            activeTool === "quick"
              ? "border-[var(--accent-cobalt)] bg-[var(--accent-cobalt)] text-white"
              : "border-[var(--border-paper)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.cards.quickAddTitle}</span>
        </button>

        <button
          type="button"
          onClick={() => toggleTool("bulk")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded border text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
            activeTool === "bulk"
              ? "border-[var(--accent-cobalt)] bg-[var(--accent-cobalt)] text-white"
              : "border-[var(--border-paper)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.cards.bulkAddTitle}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenScanForDeck(currentDeck.id)}
          className="min-h-[40px] px-3.5 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-xs font-semibold shrink-0 flex items-center gap-1.5 text-[var(--accent-cobalt)]"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{t.nav.scan} (Gemini)</span>
        </button>

        <button
          type="button"
          onClick={() => toggleTool("import")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded border text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
            activeTool === "import"
              ? "border-[var(--accent-cobalt)] bg-[var(--accent-cobalt)] text-white"
              : "border-[var(--border-paper)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{t.importExport.title}</span>
        </button>
      </div>

      {toast && <Alert variant="success" message={toast} />}
      {error && <Alert variant="error" message={error} />}

      {activeTool === "editDeck" && (
        <form
          onSubmit={(e) => void handleInlineDeckEditSubmit(e)}
          className="index-card p-4 space-y-3"
        >
          <h2 className="font-serif-card text-lg font-semibold">
            {t.decks.editTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.decks.nameLabel}
              </label>
              <input
                type="text"
                required
                value={editDeckName}
                onChange={(e) => setEditDeckName(e.target.value)}
                className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.decks.descLabel}
              </label>
              <input
                type="text"
                value={editDeckDesc}
                onChange={(e) => setEditDeckDesc(e.target.value)}
                className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="min-h-[40px] px-3.5 py-1.5 rounded border border-[var(--border-paper)] text-xs font-semibold"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={savingDeck}
              className="min-h-[40px] px-4 py-1.5 rounded bg-[var(--accent-cobalt)] text-white text-xs font-semibold"
            >
              {t.decks.saveAction}
            </button>
          </div>
        </form>
      )}

      {activeTool === "quick" && <QuickAddCardForm onAddCard={quickAddCard} />}
      {activeTool === "bulk" && <BulkAddCardsForm onBulkAdd={bulkAddCards} />}
      {activeTool === "import" && (
        <ImportExportPanel onExport={exportCards} onImport={importCards} />
      )}

      <CardFilterBar
        searchQuery={searchQuery}
        stateFilter={stateFilter}
        tagFilter={tagFilter}
        availableTags={allTagsInView}
        onSearchChange={setSearchQuery}
        onStateChange={setStateFilter}
        onTagChange={setTagFilter}
      />

      {loadingCards ? (
        <div className="index-card p-8 text-center text-sm text-[var(--ink-muted)]">
          {t.common.loading}
        </div>
      ) : cards.length === 0 ? (
        <div className="index-card p-8 text-center text-sm text-[var(--ink-secondary)]">
          {searchQuery || stateFilter || tagFilter
            ? t.cards.emptyFilter
            : t.cards.emptyDeck}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cards.map((c) => (
            <CardGridItem
              key={c.id}
              card={c}
              onSelect={(card) => void openCardInspector(card)}
            />
          ))}
        </div>
      )}

      {inspectedCard && (
        <CardInspectorModal
          card={inspectedCard}
          saving={savingCardEdit}
          onSave={saveCardEdit}
          onDelete={removeCard}
          onClose={closeCardInspector}
        />
      )}
    </div>
  );
}
