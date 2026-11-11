"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardInput, CardState, Deck } from "@/lib/types";
import { fiszkiApi } from "@/lib/api";
import { Locale, translations } from "@/lib/i18n";
import {
  ArrowLeft,
  Play,
  Sparkles,
  Camera,
  Download,
  Upload,
  Plus,
  Layers,
  Edit3,
  Trash2,
  Search,
  X,
  Check,
  MoreVertical,
} from "lucide-react";

interface DeckDetailViewProps {
  locale: Locale;
  deck: Deck;
  onBack: () => void;
  onStartStudy: (deckId: string, mode: "due" | "practice") => void;
  onOpenScanForDeck: (deckId: string) => void;
  onDeckUpdated: (updated: Deck) => void;
  onDeckDeleted: (deckId: string) => void;
  onDataChanged: () => void;
}

type ToolTab = "quick" | "bulk" | "import" | "editDeck" | null;

export function DeckDetailView({
  locale,
  deck,
  onBack,
  onStartStudy,
  onOpenScanForDeck,
  onDeckUpdated,
  onDeckDeleted,
  onDataChanged,
}: DeckDetailViewProps) {
  const t = translations[locale];
  const frontInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [currentDeck, setCurrentDeck] = useState<Deck>(deck);
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Server filters for GET /api/v1/decks/{deckID}/cards
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<CardState | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Active workbench drawer/panel
  const [activeTool, setActiveTool] = useState<ToolTab>("quick");

  // Quick-Add Card state
  const [front, setFront] = useState<string>("");
  const [back, setBack] = useState<string>("");
  const [tagsText, setTagsText] = useState<string>("");
  const [addingCard, setAddingCard] = useState<boolean>(false);

  // Bulk-Add state
  const [bulkText, setBulkText] = useState<string>("");
  const [bulkSaving, setBulkSaving] = useState<boolean>(false);

  // Import/Export state
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [importRaw, setImportRaw] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);

  // Deck Edit state
  const [showDeckMenu, setShowDeckMenu] = useState<boolean>(false);
  const [editDeckName, setEditDeckName] = useState<string>(deck.name);
  const [editDeckDesc, setEditDeckDesc] = useState<string>(deck.description);
  const [savingDeck, setSavingDeck] = useState<boolean>(false);

  // Card Inspector / Editor state (GET / PUT / DELETE /api/v1/cards/{cardID})
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [editCardFront, setEditCardFront] = useState<string>("");
  const [editCardBack, setEditCardBack] = useState<string>("");
  const [editCardTags, setEditCardTags] = useState<string>("");
  const [savingCardEdit, setSavingCardEdit] = useState<boolean>(false);

  const refreshDeckAndCards = useCallback(async () => {
    setLoadingCards(true);
    setError(null);
    try {
      const [freshDeck, list] = await Promise.all([
        fiszkiApi.getDeck(deck.id),
        fiszkiApi.listCards(deck.id, {
          q: searchQuery.trim() || undefined,
          state: stateFilter || undefined,
          tag: tagFilter.trim() || undefined,
        }),
      ]);
      setCurrentDeck(freshDeck);
      onDeckUpdated(freshDeck);
      setCards(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deck");
    } finally {
      setLoadingCards(false);
    }
  }, [deck.id, searchQuery, stateFilter, tagFilter, onDeckUpdated]);

  useEffect(() => {
    void refreshDeckAndCards();
  }, [refreshDeckAndCards]);

  function showToastMessage(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function handleQuickAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!front.trim() || !back.trim() || addingCard) return;

    setAddingCard(true);
    setError(null);
    try {
      const tags = tagsText
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      await fiszkiApi.createCard(currentDeck.id, {
        front: front.trim(),
        back: back.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });
      setFront("");
      setBack("");
      frontInputRef.current?.focus();
      await refreshDeckAndCards();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setAddingCard(false);
    }
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const inputs: CardInput[] = [];
    for (const line of lines) {
      const parts = line.includes("|") ? line.split("|") : line.split("\t");
      if (parts.length >= 2) {
        const f = parts[0].trim();
        const b = parts[1].trim();
        const tList = parts[2]
          ? parts[2]
              .split(/[;,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
        if (f && b) {
          inputs.push({ front: f, back: b, tags: tList });
        }
      }
    }

    if (inputs.length === 0) return;
    setBulkSaving(true);
    setError(null);
    try {
      const res = await fiszkiApi.bulkCreateCards(currentDeck.id, inputs);
      setBulkText("");
      showToastMessage(`+${res.created_count} ${t.decks.cardsTotal}`);
      await refreshDeckAndCards();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk add failed");
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importRaw.trim() || importing) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fiszkiApi.importDeck(
        currentDeck.id,
        importFormat,
        importRaw
      );
      setImportRaw("");
      showToastMessage(`${t.importExport.importedToast} ${res.imported_count}`);
      await refreshDeckAndCards();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleUpdateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!editDeckName.trim() || savingDeck) return;
    setSavingDeck(true);
    setError(null);
    try {
      const updated = await fiszkiApi.updateDeck(
        currentDeck.id,
        editDeckName.trim(),
        editDeckDesc.trim()
      );
      setCurrentDeck(updated);
      onDeckUpdated(updated);
      setActiveTool(null);
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deck");
    } finally {
      setSavingDeck(false);
    }
  }

  async function handleDeleteDeck() {
    if (!window.confirm(t.decks.confirmDelete)) return;
    try {
      await fiszkiApi.deleteDeck(currentDeck.id);
      onDeckDeleted(currentDeck.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deck");
    }
  }

  async function handleOpenCardInspector(cardSummary: Card) {
    try {
      // Explicitly call GET /api/v1/cards/{cardID} to ensure fresh SM-2 state
      const freshCard = await fiszkiApi.getCard(cardSummary.id);
      setInspectedCard(freshCard);
      setEditCardFront(freshCard.front);
      setEditCardBack(freshCard.back);
      setEditCardTags((freshCard.tags || []).join(", "));
    } catch {
      setInspectedCard(cardSummary);
      setEditCardFront(cardSummary.front);
      setEditCardBack(cardSummary.back);
      setEditCardTags((cardSummary.tags || []).join(", "));
    }
  }

  async function handleSaveCardEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectedCard || !editCardFront.trim() || !editCardBack.trim()) return;
    setSavingCardEdit(true);
    setError(null);
    try {
      const tags = editCardTags
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await fiszkiApi.updateCard(inspectedCard.id, {
        front: editCardFront.trim(),
        back: editCardBack.trim(),
        tags,
      });
      setInspectedCard(updated);
      await refreshDeckAndCards();
      setInspectedCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update card");
    } finally {
      setSavingCardEdit(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    try {
      await fiszkiApi.deleteCard(cardId);
      if (inspectedCard?.id === cardId) {
        setInspectedCard(null);
      }
      await refreshDeckAndCards();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete card");
    }
  }

  const allTagsInView = useMemo(() => {
    const s = new Set<string>();
    for (const c of cards) {
      for (const tag of c.tags || []) s.add(tag);
    }
    return Array.from(s);
  }, [cards]);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Back & Deck Summary Header */}
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

          {/* Three-dots Dropdown Menu in Top-Right Corner */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDeckMenu((prev) => !prev)}
              aria-label="Deck actions"
              className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--ink-primary)] flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDeckMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDeckMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 z-40 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-lg py-1.5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setEditDeckName(currentDeck.name);
                      setEditDeckDesc(currentDeck.description);
                      setShowDeckMenu(false);
                      setActiveTool((cur) =>
                        cur === "editDeck" ? null : "editDeck"
                      );
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--accent-cobalt-soft)] flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[var(--accent-cobalt)]" />
                    <span>{t.decks.editTitle}</span>
                  </button>

                  <div className="my-1 border-t border-[var(--border-paper)]" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeckMenu(false);
                      void handleDeleteDeck();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--rule-crimson)] hover:bg-[var(--rule-crimson-soft)] flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.decks.deleteAction}</span>
                  </button>
                </div>
              </>
            )}
          </div>
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

          {/* Primary Study CTAs */}
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

      {/* Workbench Action Switcher Bar (Mobile-friendly scrollable pill strip) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() =>
            setActiveTool((cur) => (cur === "quick" ? null : "quick"))
          }
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
          onClick={() =>
            setActiveTool((cur) => (cur === "bulk" ? null : "bulk"))
          }
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
          onClick={() =>
            setActiveTool((cur) => (cur === "import" ? null : "import"))
          }
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

      {toast && (
        <div className="p-3 rounded border border-[var(--stamp-verdigris)] bg-[var(--stamp-verdigris-soft)] text-sm text-[var(--stamp-verdigris)] font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded border border-[var(--rule-crimson)] bg-[var(--rule-crimson-soft)] text-sm text-[var(--rule-crimson)]">
          {error}
        </div>
      )}

      {/* Active Tool Panel */}
      {activeTool === "editDeck" && (
        <form onSubmit={handleUpdateDeck} className="index-card p-4 space-y-3">
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

      {activeTool === "quick" && (
        <form
          onSubmit={(e) => void handleQuickAdd(e)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void handleQuickAdd();
            }
          }}
          className="index-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif-card text-base font-semibold">
              {t.cards.quickAddTitle}
            </h2>
            <span className="text-xs text-[var(--ink-muted)] hidden sm:inline">
              {t.cards.shortcutHint}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.cards.frontLabel}
              </label>
              <textarea
                ref={frontInputRef}
                rows={2}
                required
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder={t.cards.frontPlaceholder}
                className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-base font-serif-card"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.cards.backLabel}
              </label>
              <textarea
                rows={2}
                required
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder={t.cards.backPlaceholder}
                className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-base font-serif-card"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.cards.tagsLabel}
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder={t.cards.tagsPlaceholder}
                className="w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={addingCard || !front.trim() || !back.trim()}
              className="min-h-[44px] px-5 py-2.5 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {addingCard ? t.cards.addingCard : t.cards.addCardAction}
            </button>
          </div>
        </form>
      )}

      {activeTool === "bulk" && (
        <form onSubmit={handleBulkAdd} className="index-card p-4 space-y-3">
          <h2 className="font-serif-card text-base font-semibold">
            {t.cards.bulkAddTitle}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            {t.cards.bulkHelp}
          </p>
          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={t.cards.bulkPlaceholder}
            className="w-full p-3 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm font-mono-tabular"
          />
          <button
            type="submit"
            disabled={bulkSaving || !bulkText.trim()}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold disabled:opacity-50"
          >
            {t.cards.bulkSaveAction}
          </button>
        </form>
      )}

      {activeTool === "import" && (
        <div className="index-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)]">
            <h2 className="font-serif-card text-base font-semibold">
              {t.importExport.title}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void fiszkiApi.exportDeck(
                    currentDeck.id,
                    currentDeck.name,
                    "csv"
                  )
                }
                className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.importExport.exportCsv}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  void fiszkiApi.exportDeck(
                    currentDeck.id,
                    currentDeck.name,
                    "json"
                  )
                }
                className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.importExport.exportJson}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold">
                  {t.importExport.formatLabel}:
                </label>
                <select
                  value={importFormat}
                  onChange={(e) =>
                    setImportFormat(e.target.value as "csv" | "json")
                  }
                  className="min-h-[38px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-mono-tabular"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <label className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[var(--accent-cobalt)]" />
                <span>{t.importExport.uploadFile}</span>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.name.toLowerCase().endsWith(".json")) {
                      setImportFormat("json");
                    } else if (file.name.toLowerCase().endsWith(".csv")) {
                      setImportFormat("csv");
                    }
                    const text = await file.text();
                    setImportRaw(text);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <p className="text-xs text-[var(--ink-muted)] font-mono-tabular">
              {importFormat === "csv"
                ? t.importExport.csvHint
                : t.importExport.jsonHint}
            </p>

            <textarea
              rows={5}
              value={importRaw}
              onChange={(e) => setImportRaw(e.target.value)}
              placeholder={
                importFormat === "csv"
                  ? "front,back,tags\nGoroutine,Lightweight thread,go;concurrency"
                  : '[{"front":"Goroutine","back":"Lightweight thread","tags":["go"]}]'
              }
              className="w-full p-3 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-mono-tabular"
            />

            <button
              type="submit"
              disabled={importing || !importRaw.trim()}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {importing
                ? t.importExport.importing
                : t.importExport.importAction}
            </button>
          </form>
        </div>
      )}

      {/* Search & Server Filter Bar (GET /api/v1/decks/{deckID}/cards?q=&state=&tag=) */}
      <div className="index-card p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.cards.searchPlaceholder}
            className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as CardState | "")}
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
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          >
            <option value="">{t.cards.allTags}</option>
            {allTagsInView.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Index List */}
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
            <div
              key={c.id}
              onClick={() => void handleOpenCardInspector(c)}
              className="index-card p-4 hover:border-[var(--border-strong)] cursor-pointer transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono-tabular">
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] text-[var(--ink-secondary)]">
                    {t.ledger.states[c.state] || c.state}
                  </span>
                  <span className="text-[var(--ink-muted)]">
                    {c.interval_days}d · EF {c.ease_factor.toFixed(2)}
                  </span>
                </div>

                <p className="font-serif-card font-semibold text-base text-[var(--ink-primary)] line-clamp-2">
                  {c.front}
                </p>
                <p className="font-serif-card text-sm text-[var(--ink-secondary)] mt-1 line-clamp-2">
                  {c.back}
                </p>
              </div>

              {c.tags && c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--border-paper)]">
                  {c.tags.map((tag) => (
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
          ))}
        </div>
      )}

      {/* Mobile-First Bottom Sheet / Modal for Card Inspection & Editing */}
      {inspectedCard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto index-card crimson-top-rule rounded-t-xl sm:rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
              <h3 className="font-serif-card text-lg font-semibold">
                {t.cards.editCard}
              </h3>
              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="p-1.5 rounded border border-[var(--border-paper)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  {t.cards.frontLabel}
                </label>
                <textarea
                  rows={3}
                  required
                  value={editCardFront}
                  onChange={(e) => setEditCardFront(e.target.value)}
                  className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] font-serif-card text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  {t.cards.backLabel}
                </label>
                <textarea
                  rows={3}
                  required
                  value={editCardBack}
                  onChange={(e) => setEditCardBack(e.target.value)}
                  className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] font-serif-card text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  {t.cards.tagsLabel}
                </label>
                <input
                  type="text"
                  value={editCardTags}
                  onChange={(e) => setEditCardTags(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                />
              </div>

              {/* SM-2 Telemetry Readout */}
              <div className="p-3 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] space-y-1.5">
                <span className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  {t.cards.inspectTitle}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono-tabular">
                  <div>
                    <span className="text-[var(--ink-muted)] block">State</span>
                    <strong>{inspectedCard.state}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">
                      {t.cards.interval}
                    </span>
                    <strong>{inspectedCard.interval_days}d</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">
                      {t.cards.easeFactor}
                    </span>
                    <strong>{inspectedCard.ease_factor.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">
                      {t.cards.repetitions}
                    </span>
                    <strong>{inspectedCard.repetitions}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">
                      {t.cards.lapses}
                    </span>
                    <strong>{inspectedCard.lapses}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">
                      {t.cards.step}
                    </span>
                    <strong>{inspectedCard.step}</strong>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-[var(--border-paper)] text-[11px] font-mono-tabular text-[var(--ink-muted)] flex flex-wrap justify-between gap-2">
                  <span>
                    {t.cards.dueAt}:{" "}
                    {new Date(inspectedCard.due_at).toLocaleString(
                      locale === "pl" ? "pl-PL" : "en-US"
                    )}
                  </span>
                  <span>
                    {t.cards.lastReviewed}:{" "}
                    {inspectedCard.last_reviewed_at
                      ? new Date(inspectedCard.last_reviewed_at).toLocaleString(
                          locale === "pl" ? "pl-PL" : "en-US"
                        )
                      : t.cards.neverReviewed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteCard(inspectedCard.id)}
                  className="min-h-[44px] px-3.5 py-2 rounded border border-[var(--rule-crimson)] text-[var(--rule-crimson)] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.cards.deleteCard}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedCard(null)}
                    className="min-h-[44px] px-4 py-2 rounded border border-[var(--border-paper)] text-xs font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingCardEdit}
                    className="min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-xs font-semibold"
                  >
                    {t.cards.saveCard}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
