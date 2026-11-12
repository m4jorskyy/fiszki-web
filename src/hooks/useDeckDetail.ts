"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card, CardState, Deck, DeckExportFormat } from "@/types";
import {
  bulkCreateCards,
  createCard,
  deleteCard,
  deleteDeck,
  exportDeck,
  getCard,
  getDeck,
  importDeck,
  listCards,
  updateCard,
  updateDeck,
} from "@/api";
import { usePreferences } from "@/context/PreferencesContext";
import { parseBulkCardsText } from "@/utils/bulkParser";
import { parseTagsInput } from "@/utils/tags";

export type DeckToolTab = "quick" | "bulk" | "import" | "editDeck" | null;

interface UseDeckDetailOptions {
  deck: Deck;
  onDeckUpdated: (updated: Deck) => void;
  onDeckDeleted: (deckId: string) => void;
  onDataChanged: () => void;
}

export function useDeckDetail({
  deck,
  onDeckUpdated,
  onDeckDeleted,
  onDataChanged,
}: UseDeckDetailOptions) {
  const { t } = usePreferences();
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentDeck, setCurrentDeck] = useState<Deck>(deck);
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Server filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<CardState | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Tool panel state
  const [activeTool, setActiveTool] = useState<DeckToolTab>("quick");

  // Card inspector modal state
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [savingCardEdit, setSavingCardEdit] = useState<boolean>(false);

  const showToastMessage = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const refreshDeckAndCards = useCallback(async () => {
    setLoadingCards(true);
    setError(null);
    try {
      const [freshDeck, list] = await Promise.all([
        getDeck(deck.id),
        listCards(deck.id, {
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

  const toggleTool = useCallback((tool: Exclude<DeckToolTab, null>) => {
    setActiveTool((cur) => (cur === tool ? null : tool));
  }, []);

  const quickAddCard = useCallback(
    async (front: string, back: string, tagsText: string): Promise<boolean> => {
      if (!front.trim() || !back.trim()) return false;
      setError(null);
      try {
        const tags = parseTagsInput(tagsText);
        await createCard(currentDeck.id, {
          front: front.trim(),
          back: back.trim(),
          tags: tags.length > 0 ? tags : undefined,
        });
        await refreshDeckAndCards();
        onDataChanged();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create card");
        return false;
      }
    },
    [currentDeck.id, refreshDeckAndCards, onDataChanged]
  );

  const bulkAddCards = useCallback(
    async (rawBulkText: string): Promise<boolean> => {
      const inputs = parseBulkCardsText(rawBulkText);
      if (inputs.length === 0) return false;

      setError(null);
      try {
        const res = await bulkCreateCards(currentDeck.id, inputs);
        showToastMessage(`+${res.created_count} ${t.decks.cardsTotal}`);
        await refreshDeckAndCards();
        onDataChanged();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk add failed");
        return false;
      }
    },
    [
      currentDeck.id,
      showToastMessage,
      t.decks.cardsTotal,
      refreshDeckAndCards,
      onDataChanged,
    ]
  );

  const importCards = useCallback(
    async (format: DeckExportFormat, rawContent: string): Promise<boolean> => {
      if (!rawContent.trim()) return false;
      setError(null);
      try {
        const res = await importDeck(currentDeck.id, format, rawContent);
        showToastMessage(
          `${t.importExport.importedToast} ${res.imported_count}`
        );
        await refreshDeckAndCards();
        onDataChanged();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
        return false;
      }
    },
    [
      currentDeck.id,
      showToastMessage,
      t.importExport.importedToast,
      refreshDeckAndCards,
      onDataChanged,
    ]
  );

  const exportCards = useCallback(
    async (format: DeckExportFormat) => {
      setError(null);
      try {
        await exportDeck(currentDeck.id, currentDeck.name, format);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed");
      }
    },
    [currentDeck.id, currentDeck.name]
  );

  const saveDeckEdit = useCallback(
    async (name: string, description: string): Promise<boolean> => {
      if (!name.trim()) return false;
      setError(null);
      try {
        const updated = await updateDeck(
          currentDeck.id,
          name.trim(),
          description.trim()
        );
        setCurrentDeck(updated);
        onDeckUpdated(updated);
        setActiveTool(null);
        onDataChanged();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update deck");
        return false;
      }
    },
    [currentDeck.id, onDeckUpdated, onDataChanged]
  );

  const removeDeck = useCallback(async () => {
    if (!window.confirm(t.decks.confirmDelete)) return;
    try {
      await deleteDeck(currentDeck.id);
      onDeckDeleted(currentDeck.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deck");
    }
  }, [currentDeck.id, onDeckDeleted, t.decks.confirmDelete]);

  const openCardInspector = useCallback(async (cardSummary: Card) => {
    try {
      const freshCard = await getCard(cardSummary.id);
      setInspectedCard(freshCard);
    } catch {
      setInspectedCard(cardSummary);
    }
  }, []);

  const closeCardInspector = useCallback(() => {
    setInspectedCard(null);
  }, []);

  const saveCardEdit = useCallback(
    async (front: string, back: string, tagsText: string) => {
      if (!inspectedCard || !front.trim() || !back.trim()) return;
      setSavingCardEdit(true);
      setError(null);
      try {
        const tags = parseTagsInput(tagsText);
        const updated = await updateCard(inspectedCard.id, {
          front: front.trim(),
          back: back.trim(),
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
    },
    [inspectedCard, refreshDeckAndCards]
  );

  const removeCard = useCallback(
    async (cardId: string) => {
      try {
        await deleteCard(cardId);
        if (inspectedCard?.id === cardId) {
          setInspectedCard(null);
        }
        await refreshDeckAndCards();
        onDataChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete card");
      }
    },
    [inspectedCard?.id, refreshDeckAndCards, onDataChanged]
  );

  const allTagsInView = useMemo(() => {
    const s = new Set<string>();
    for (const c of cards) {
      for (const tag of c.tags || []) s.add(tag);
    }
    return Array.from(s);
  }, [cards]);

  return {
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
  };
}
