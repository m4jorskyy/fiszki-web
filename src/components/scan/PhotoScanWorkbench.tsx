"use client";

import React, { useRef } from "react";
import {
  ArrowLeftRight,
  Camera,
  Check,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { usePhotoScan } from "@/hooks/usePhotoScan";
import { Alert } from "@/components/ui/Alert";
import { CandidateCardItem } from "./CandidateCardItem";

interface PhotoScanWorkbenchProps {
  decks: Deck[];
  defaultDeckId?: string;
  onCardsSaved: (deckId: string, count: number) => void;
  onDeckCreated: (newDeck: Deck) => void;
}

export function PhotoScanWorkbench({
  decks,
  defaultDeckId,
  onCardsSaved,
  onDeckCreated,
}: PhotoScanWorkbenchProps) {
  const { t } = usePreferences();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
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
  } = usePhotoScan({
    decks,
    defaultDeckId,
    onCardsSaved,
    onDeckCreated,
  });

  return (
    <div className="space-y-5 pb-20">
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
        <Alert variant="error" message={error} className="p-3.5 font-medium" />
      )}

      {(previewUrl || extracting || candidates.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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
                      onClick={swapAllCandidates}
                      className="min-h-[36px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{t.scan.swapFrontBack}</span>
                    </button>

                    <button
                      type="button"
                      onClick={addEmptyCandidate}
                      className="min-h-[36px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.scan.addEmptyRow}</span>
                    </button>
                  </div>
                </div>

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

                {hasExtractedOnce && candidates.length === 0 ? (
                  <p className="text-sm text-[var(--ink-secondary)] py-6 text-center">
                    {t.scan.noCandidates}
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                    {candidates.map((item, idx) => (
                      <CandidateCardItem
                        key={item.id}
                        item={item}
                        index={idx}
                        onUpdate={updateCandidate}
                        onRemove={removeCandidate}
                      />
                    ))}
                  </div>
                )}

                {candidates.length > 0 && (
                  <button
                    type="button"
                    disabled={saving || selectedCount === 0}
                    onClick={() => void commitToDeck()}
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
