"use client";

import { useCallback, useEffect, useState } from "react";
import type { Deck, EditableCandidate } from "@/types";
import { bulkCreateCards, createDeck, extractFromPhoto } from "@/api";
import { usePreferences } from "@/context/PreferencesContext";
import { parseTagsInput } from "@/utils/tags";

interface UsePhotoScanOptions {
  decks: Deck[];
  defaultDeckId?: string;
  onCardsSaved: (deckId: string, count: number) => void;
  onDeckCreated: (newDeck: Deck) => void;
}

export function usePhotoScan({
  decks,
  defaultDeckId,
  onCardsSaved,
  onDeckCreated,
}: UsePhotoScanOptions) {
  const { locale } = usePreferences();

  const [targetDeckId, setTargetDeckId] = useState<string>(
    defaultDeckId || decks[0]?.id || "__new__"
  );
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [batchTags, setBatchTags] = useState<string>("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<EditableCandidate[]>([]);
  const [hasExtractedOnce, setHasExtractedOnce] = useState<boolean>(false);

  useEffect(() => {
    if (defaultDeckId) {
      setTargetDeckId(defaultDeckId);
    } else if (decks.length > 0 && targetDeckId === "__new__") {
      setTargetDeckId(decks[0].id);
    }
  }, [defaultDeckId, decks, targetDeckId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processImageFile = useCallback(async (file: File) => {
    setError(null);
    setExtracting(true);
    setHasExtractedOnce(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    try {
      const res = await extractFromPhoto(file);
      const mapped: EditableCandidate[] = res.cards.map((c, idx) => ({
        id: `${Date.now()}-${idx}`,
        front: c.front,
        back: c.back,
        selected: true,
      }));
      setCandidates(mapped);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to extract cards from photo"
      );
    } finally {
      setExtracting(false);
    }
  }, []);

  // Support global clipboard image paste (Cmd+V / Ctrl+V)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void processImageFile(file);
            break;
          }
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processImageFile]);

  const swapAllCandidates = useCallback(() => {
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        front: c.back,
        back: c.front,
      }))
    );
  }, []);

  const addEmptyCandidate = useCallback(() => {
    setCandidates((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        front: "",
        back: "",
        selected: true,
      },
    ]);
  }, []);

  const updateCandidate = useCallback(
    (id: string, patch: Partial<EditableCandidate>) => {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const removeCandidate = useCallback((id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const commitToDeck = useCallback(async () => {
    const validRows = candidates.filter(
      (c) => c.selected && c.front.trim() !== "" && c.back.trim() !== ""
    );
    if (validRows.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      let destinationDeckId = targetDeckId;
      if (destinationDeckId === "__new__" || !destinationDeckId) {
        const nameToCreate =
          newDeckName.trim() ||
          `Skan ${new Date().toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US")}`;
        const createdDeck = await createDeck(nameToCreate, "");
        onDeckCreated(createdDeck);
        destinationDeckId = createdDeck.id;
        setTargetDeckId(createdDeck.id);
      }

      const parsedTags = parseTagsInput(batchTags);

      const res = await bulkCreateCards(
        destinationDeckId,
        validRows.map((c) => ({
          front: c.front.trim(),
          back: c.back.trim(),
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        }))
      );

      onCardsSaved(destinationDeckId, res.created_count);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save extracted cards"
      );
    } finally {
      setSaving(false);
    }
  }, [
    candidates,
    targetDeckId,
    newDeckName,
    locale,
    onDeckCreated,
    batchTags,
    onCardsSaved,
  ]);

  const selectedCount = candidates.filter(
    (c) => c.selected && c.front.trim() && c.back.trim()
  ).length;

  return {
    targetDeckId,
    newDeckName,
    batchTags,
    previewUrl,
    extracting,
    saving,
    error,
    candidates,
    hasExtractedOnce,
    selectedCount,
    setTargetDeckId,
    setNewDeckName,
    setBatchTags,
    processImageFile,
    swapAllCandidates,
    addEmptyCandidate,
    updateCandidate,
    removeCandidate,
    commitToDeck,
  };
}
