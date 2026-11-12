"use client";

import React from "react";
import { BookOpen, Filter } from "lucide-react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { useStudySession } from "@/hooks/useStudySession";
import { Alert } from "@/components/ui/Alert";
import { StudyFilterTray } from "./StudyFilterTray";
import { FlashcardFlipCard } from "./FlashcardFlipCard";
import { StudyRatingBar } from "./StudyRatingBar";
import { StudySessionComplete } from "./StudySessionComplete";

interface StudySessionViewProps {
  decks: Deck[];
  initialDeckId?: string;
  initialMode?: "due" | "practice";
  onSessionReviewed: () => void;
}

export function StudySessionView({
  decks,
  initialDeckId = "",
  initialMode = "due",
  onSessionReviewed,
}: StudySessionViewProps) {
  const { t } = usePreferences();
  const {
    selectedDeckId,
    selectedTag,
    limit,
    mode,
    showFilters,
    cards,
    upcomingCards,
    nextDueMs,
    nowMs,
    manualCheckNotice,
    currentIndex,
    currentCard,
    flipped,
    loading,
    submitting,
    error,
    reviewedInSession,
    lastReviewLog,
    isSm2Mode,
    previews,
    deckNameMap,
    learningWaitingCount,
    setSelectedDeckId,
    setSelectedTag,
    setLimit,
    setMode,
    setShowFilters,
    setFlipped,
    toggleFlipped,
    goPrevCard,
    goNextCard,
    handleRate,
    loadStudyQueue,
  } = useStudySession({
    decks,
    initialDeckId,
    initialMode,
    onSessionReviewed,
  });

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8.5rem)] justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h1 className="font-serif-card text-xl sm:text-2xl font-semibold">
              {t.study.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-cobalt-soft)] border border-[var(--border-paper)] text-xs font-mono-tabular text-[var(--accent-cobalt)] font-semibold">
              {isSm2Mode
                ? `${cards.length} cards`
                : `${cards.length > 0 ? currentIndex + 1 : 0} / ${cards.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMode((m) => (m === "practice" ? "due" : "practice"))
              }
              className="min-h-[38px] px-3 py-1.5 rounded-full border border-[var(--border-paper)] bg-[var(--bg-card)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent-cobalt)]" />
              <span>
                {mode === "practice" ? t.study.modePractice : t.study.modeDue}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                showFilters || selectedDeckId || selectedTag
                  ? "border-[var(--accent-cobalt)] bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)]"
                  : "border-[var(--border-paper)] bg-[var(--bg-card)] text-[var(--ink-secondary)]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {selectedDeckId
                  ? deckNameMap[selectedDeckId] || t.study.filterDeck
                  : t.study.allDecks}
              </span>
            </button>
          </div>
        </div>

        {showFilters && (
          <StudyFilterTray
            decks={decks}
            selectedDeckId={selectedDeckId}
            selectedTag={selectedTag}
            limit={limit}
            onDeckChange={setSelectedDeckId}
            onTagChange={setSelectedTag}
            onLimitChange={setLimit}
          />
        )}

        {mode === "practice" && (
          <div className="mb-3 px-3 py-2 rounded border border-[var(--border-paper)] bg-[var(--bg-recessed)] text-xs text-[var(--ink-secondary)]">
            {t.study.practiceNotice}
          </div>
        )}

        {error && <Alert variant="error" message={error} className="mb-3" />}
      </div>

      {loading ? (
        <div className="index-stack p-10 my-auto text-center text-sm text-[var(--ink-muted)]">
          {t.common.loading}
        </div>
      ) : !currentCard ? (
        <StudySessionComplete
          reviewedInSession={reviewedInSession}
          nextDueMs={nextDueMs}
          nowMs={nowMs}
          learningWaitingCount={learningWaitingCount}
          upcomingCount={upcomingCards.length}
          manualCheckNotice={manualCheckNotice}
          onStudyAhead={() => setMode("ahead")}
          onReloadQueue={() => {
            setMode("due");
            void loadStudyQueue(true);
          }}
          onStartPractice={() => setMode("practice")}
        />
      ) : (
        <div className="my-auto flex flex-col gap-3">
          <FlashcardFlipCard
            card={currentCard}
            deckName={deckNameMap[currentCard.deck_id] || "Talia"}
            flipped={flipped}
            onToggleFlip={toggleFlipped}
          />

          {lastReviewLog && (
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-paper)] text-xs font-mono-tabular text-[var(--ink-secondary)] flex items-center justify-between">
              <span>
                {t.study.lastLogNotice} {lastReviewLog.prev_state} →{" "}
                {lastReviewLog.new_state}
              </span>
              <span>
                {lastReviewLog.prev_interval_days}d →{" "}
                {lastReviewLog.new_interval_days}d (EF{" "}
                {lastReviewLog.new_ease_factor.toFixed(2)})
              </span>
            </div>
          )}
        </div>
      )}

      {currentCard && (
        <StudyRatingBar
          isSm2Mode={isSm2Mode}
          flipped={flipped}
          submitting={submitting}
          currentIndex={currentIndex}
          totalCards={cards.length}
          previews={previews}
          onReveal={() => setFlipped(true)}
          onToggleFlip={toggleFlipped}
          onRate={(rating) => void handleRate(rating)}
          onPrev={goPrevCard}
          onNext={goNextCard}
        />
      )}
    </div>
  );
}
