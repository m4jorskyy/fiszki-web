"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Deck, ExtractedCardCandidate } from "@/lib/types";
import { fiszkiApi } from "@/lib/api";
import { Locale, translations } from "@/lib/i18n";
import {
  Camera,
  Upload,
  ArrowLeftRight,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

interface EditableCandidate extends ExtractedCardCandidate {
  id: string;
  selected: boolean;
}

interface PhotoScanWorkbenchProps {
  locale: Locale;
  decks: Deck[];
  defaultDeckId?: string;
  onCardsSaved: (deckId: string, count: number) => void;
  onDeckCreated: (newDeck: Deck) => void;
}

export function PhotoScanWorkbench({
  locale,
  decks,
  defaultDeckId,
  onCardsSaved,
  onDeckCreated,
}: PhotoScanWorkbenchProps) {
  const t = translations[locale];
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const res = await fiszkiApi.extractFromPhoto(file);
      const mapped: EditableCandidate[] = res.cards.map((c, idx) => ({
        id: `${Date.now()}-${idx}`,
        front: c.front,
        back: c.back,
        selected: true,
      }));
      setCandidates(mapped);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract cards from photo"
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

  function handleSwapAll() {
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        front: c.back,
        back: c.front,
      }))
    );
  }

  function handleAddEmptyRow() {
    setCandidates((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        front: "",
        back: "",
        selected: true,
      },
    ]);
  }

  async function handleCommitToDeck() {
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
        const createdDeck = await fiszkiApi.createDeck(nameToCreate, "");
        onDeckCreated(createdDeck);
        destinationDeckId = createdDeck.id;
        setTargetDeckId(createdDeck.id);
      }

      const parsedTags = batchTags
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fiszkiApi.bulkCreateCards(
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
  }

  const selectedCount = candidates.filter(
    (c) => c.selected && c.front.trim() && c.back.trim()
  ).length;

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="index-card crimson-top-rule p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif-card text-xl sm:text-2xl font-semibold">
              {t.scan.title}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1 max-w-2xl">
              {t.scan.subtitle}
            </p>
          </div>
          <Sparkles className="w-6 h-6 text-[var(--accent-cobalt)] shrink-0 mt-1" />
        </div>

        {/* Hidden Inputs for Camera (mobile-first capture="environment") and File Picker */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processImageFile(file);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processImageFile(file);
            e.target.value = "";
          }}
        />

        {/* Mobile-First Capture Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            disabled={extracting}
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-[52px] px-4 py-3 rounded bg-[var(--accent-cobalt)] text-white font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span>{t.scan.takePhoto}</span>
          </button>

          <button
            type="button"
            disabled={extracting}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[52px] px-4 py-3 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-5 h-5 text-[var(--accent-cobalt)]" />
            <span>{t.scan.chooseImage}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
          <span>{t.scan.pasteHint}</span>
          <span className="font-mono-tabular">{t.scan.maxSizeHint}</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded border border-[var(--rule-crimson)] bg-[var(--rule-crimson-soft)] text-sm text-[var(--rule-crimson)] font-medium">
          {error}
        </div>
      )}

      {/* Workbench Area: Photo Preview + Staging List */}
      {(previewUrl || extracting || candidates.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Photo Preview Column */}
          {previewUrl && (
            <div className="lg:col-span-4 index-card p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] mb-2">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Source image</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Scanned study material"
                className="w-full max-h-[380px] object-contain rounded border border-[var(--border-paper)] bg-[var(--bg-recessed)]"
              />
            </div>
          )}

          {/* Extracted Candidates Staging Column */}
          <div
            className={`${
              previewUrl ? "lg:col-span-8" : "lg:col-span-12"
            } space-y-4`}
          >
            {extracting ? (
              <div className="index-stack p-8 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-cobalt)] border-t-transparent animate-spin mx-auto mb-3" />
                <p className="font-medium text-sm text-[var(--ink-primary)]">
                  {t.scan.extracting}
                </p>
              </div>
            ) : (
              <div className="index-card p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)]">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif-card text-lg font-semibold">
                      {t.scan.extractedCount}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)] font-mono-tabular text-xs font-semibold">
                      {selectedCount} / {candidates.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSwapAll}
                      className="min-h-[36px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{t.scan.swapFrontBack}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddEmptyRow}
                      className="min-h-[36px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.scan.addEmptyRow}</span>
                    </button>
                  </div>
                </div>

                {/* Target Deck & Batch Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--bg-recessed)] p-3 rounded border border-[var(--border-paper)]">
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                      {t.scan.targetDeckLabel}
                    </label>
                    <select
                      value={targetDeckId}
                      onChange={(e) => setTargetDeckId(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                    >
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.counts.total_cards})
                        </option>
                      ))}
                      <option value="__new__">{t.scan.createDeckInline}</option>
                    </select>
                    {targetDeckId === "__new__" && (
                      <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder={t.decks.namePlaceholder}
                        className="w-full mt-2 min-h-[40px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                      {t.scan.batchTagsLabel}
                    </label>
                    <input
                      type="text"
                      value={batchTags}
                      onChange={(e) => setBatchTags(e.target.value)}
                      placeholder={t.cards.tagsPlaceholder}
                      className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                    />
                  </div>
                </div>

                {/* Candidate Cards List */}
                {hasExtractedOnce && candidates.length === 0 ? (
                  <p className="text-sm text-[var(--ink-secondary)] py-6 text-center">
                    {t.scan.noCandidates}
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                    {candidates.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded border transition-colors ${
                          item.selected
                            ? "border-[var(--border-paper)] bg-[var(--bg-elevated)]"
                            : "border-dashed border-[var(--border-paper)] bg-[var(--bg-recessed)] opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="flex items-center gap-2 text-xs font-mono-tabular font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) =>
                                setCandidates((prev) =>
                                  prev.map((c) =>
                                    c.id === item.id
                                      ? { ...c, selected: e.target.checked }
                                      : c
                                  )
                                )
                              }
                              className="w-4 h-4 accent-[var(--accent-cobalt)]"
                            />
                            <span>#{idx + 1}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setCandidates((prev) =>
                                prev.filter((c) => c.id !== item.id)
                              )
                            }
                            className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--rule-crimson)]"
                            aria-label="Remove candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">
                              {t.cards.frontLabel}
                            </span>
                            <textarea
                              rows={2}
                              value={item.front}
                              onChange={(e) =>
                                setCandidates((prev) =>
                                  prev.map((c) =>
                                    c.id === item.id
                                      ? { ...c, front: e.target.value }
                                      : c
                                  )
                                )
                              }
                              className="w-full p-2 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-sm font-serif-card"
                            />
                          </div>

                          <div>
                            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">
                              {t.cards.backLabel}
                            </span>
                            <textarea
                              rows={2}
                              value={item.back}
                              onChange={(e) =>
                                setCandidates((prev) =>
                                  prev.map((c) =>
                                    c.id === item.id
                                      ? { ...c, back: e.target.value }
                                      : c
                                  )
                                )
                              }
                              className="w-full p-2 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-sm font-serif-card"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {candidates.length > 0 && (
                  <button
                    type="button"
                    disabled={saving || selectedCount === 0}
                    onClick={() => void handleCommitToDeck()}
                    className="w-full min-h-[50px] rounded bg-[var(--stamp-verdigris)] text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    <span>
                      {saving
                        ? t.scan.savingToDeck
                        : `${t.scan.saveToDeck} (${selectedCount})`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
