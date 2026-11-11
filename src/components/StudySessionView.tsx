"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Deck,
  Rating,
  RATING_AGAIN,
  RATING_EASY,
  RATING_GOOD,
  RATING_HARD,
  ReviewLog,
} from "@/lib/types";
import { fiszkiApi } from "@/lib/api";
import { previewSchedule } from "@/lib/sm2";
import { Locale, translations } from "@/lib/i18n";
import {
  CheckCircle2,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Clock,
  FastForward,
} from "lucide-react";

type StudyMode = "due" | "ahead" | "practice";

interface StudySessionViewProps {
  locale: Locale;
  decks: Deck[];
  initialDeckId?: string;
  initialMode?: "due" | "practice";
  onSessionReviewed: () => void;
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "00:00";
  const totalSec = Math.ceil(msRemaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 24) {
    const days = Math.round(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function StudySessionView({
  locale,
  decks,
  initialDeckId = "",
  initialMode = "due",
  onSessionReviewed,
}: StudySessionViewProps) {
  const t = translations[locale];
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [mode, setMode] = useState<StudyMode>(initialMode);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [cards, setCards] = useState<Card[]>([]);
  const [upcomingCards, setUpcomingCards] = useState<Card[]>([]);
  const [nextDueMs, setNextDueMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [manualCheckNotice, setManualCheckNotice] = useState<string | null>(
    null
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewedInSession, setReviewedInSession] = useState<number>(0);
  const [lastReviewLog, setLastReviewLog] = useState<ReviewLog | null>(null);

  useEffect(() => {
    if (initialDeckId !== undefined) {
      setSelectedDeckId(initialDeckId);
    }
  }, [initialDeckId]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const decksRef = React.useRef<Deck[]>(decks);
  useEffect(() => {
    decksRef.current = decks;
  }, [decks]);

  const fetchAllFilteredCards = useCallback(async (): Promise<Card[]> => {
    if (selectedDeckId) {
      return fiszkiApi.listCards(selectedDeckId, {
        tag: selectedTag.trim() || undefined,
      });
    }
    const allLists = await Promise.all(
      decksRef.current.map((d) =>
        fiszkiApi.listCards(d.id, {
          tag: selectedTag.trim() || undefined,
        })
      )
    );
    return allLists.flat();
  }, [selectedDeckId, selectedTag]);

  const loadStudyQueue = useCallback(
    async (isManualCheck = false) => {
      setLoading(true);
      setError(null);
      if (!isManualCheck) {
        setManualCheckNotice(null);
      }
      setFlipped(false);
      setCurrentIndex(0);
      try {
        if (mode === "due") {
          const res = await fiszkiApi.getDueCards({
            deck_id: selectedDeckId || undefined,
            tag: selectedTag.trim() || undefined,
            limit,
          });
          setCards(res.cards);

          if (res.cards.length === 0) {
            // Inspect upcoming cards in the deck(s) so we can show a live countdown and offer "Review Ahead"
            const allCards = await fetchAllFilteredCards();
            const sortedByDue = [...allCards].sort(
              (a, b) =>
                new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
            );
            setUpcomingCards(sortedByDue);
            const earliest = sortedByDue[0]
              ? new Date(sortedByDue[0].due_at).getTime()
              : null;
            setNextDueMs(earliest);

            if (isManualCheck) {
              const timeStr = new Date().toLocaleTimeString(
                locale === "pl" ? "pl-PL" : "en-US"
              );
              setManualCheckNotice(`[${timeStr}] ${t.study.checkedNoDueYet}`);
            }
          } else {
            setManualCheckNotice(null);
            setNextDueMs(null);
          }
        } else if (mode === "ahead") {
          // Review ahead of schedule (SM-2 enabled): prioritize learning/relearning first, then earliest due_at
          const allCards = await fetchAllFilteredCards();
          const sorted = [...allCards].sort((a, b) => {
            const rank = (s: string) =>
              s === "learning" || s === "relearning" ? 0 : s === "new" ? 1 : 2;
            if (rank(a.state) !== rank(b.state)) {
              return rank(a.state) - rank(b.state);
            }
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          });
          setCards(sorted.slice(0, limit));
          setManualCheckNotice(null);
        } else {
          // Free practice mode (no SM-2 mutation)
          const allCards = await fetchAllFilteredCards();
          setCards(allCards.slice(0, limit));
          setManualCheckNotice(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load study cards"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      mode,
      selectedDeckId,
      selectedTag,
      limit,
      fetchAllFilteredCards,
      locale,
      t.study.checkedNoDueYet,
    ]
  );

  useEffect(() => {
    void loadStudyQueue(false);
  }, [loadStudyQueue]);

  // 1-second ticker when waiting for next due card; automatically reloads queue when countdown hits 0
  useEffect(() => {
    if (cards.length > 0 || !nextDueMs || mode !== "due") return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= nextDueMs) {
        clearInterval(interval);
        void loadStudyQueue(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cards.length, nextDueMs, mode, loadStudyQueue]);

  const currentCard: Card | undefined = cards[currentIndex];
  const isSm2Mode = mode === "due" || mode === "ahead";

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentCard || submitting || !isSm2Mode) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fiszkiApi.submitReview(currentCard.id, rating);
        setLastReviewLog(res.review_log);
        setReviewedInSession((c) => c + 1);
        setFlipped(false);
        const remaining = cards.filter((_, idx) => idx !== currentIndex);
        setCards(remaining);
        onSessionReviewed();
        if (remaining.length === 0 && mode === "due") {
          void loadStudyQueue(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to submit review"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      currentCard,
      submitting,
      isSm2Mode,
      cards,
      currentIndex,
      onSessionReviewed,
      mode,
      loadStudyQueue,
    ]
  );

  // Keyboard shortcuts for desktop ergonomics: Space to flip, 1-4 to rate
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (!currentCard) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && isSm2Mode) {
        if (e.key === "1") void handleRate(RATING_AGAIN);
        if (e.key === "2") void handleRate(RATING_HARD);
        if (e.key === "3") void handleRate(RATING_GOOD);
        if (e.key === "4") void handleRate(RATING_EASY);
      } else if (mode === "practice") {
        if (e.key === "ArrowRight") {
          setFlipped(false);
          setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
        } else if (e.key === "ArrowLeft") {
          setFlipped(false);
          setCurrentIndex((i) => Math.max(0, i - 1));
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentCard, flipped, isSm2Mode, mode, handleRate, cards.length]);

  const previews = useMemo(() => {
    if (!currentCard) return null;
    return {
      again: previewSchedule(currentCard, RATING_AGAIN, locale),
      hard: previewSchedule(currentCard, RATING_HARD, locale),
      good: previewSchedule(currentCard, RATING_GOOD, locale),
      easy: previewSchedule(currentCard, RATING_EASY, locale),
    };
  }, [currentCard, locale]);

  const deckNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of decks) map[d.id] = d.name;
    return map;
  }, [decks]);

  const learningWaitingCount = useMemo(
    () =>
      upcomingCards.filter(
        (c) => c.state === "learning" || c.state === "relearning"
      ).length,
    [upcomingCards]
  );

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8.5rem)] justify-between gap-4">
      {/* Top Session Bar & Filter Toggle */}
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

        {/* Collapsible Filter Tray */}
        {showFilters && (
          <div className="index-card p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.study.filterDeck}
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
              >
                <option value="">{t.study.allDecks}</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.counts.due_cards} due / {d.counts.total_cards})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.study.filterTag}
              </label>
              <input
                type="text"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                placeholder="np. rozdział-1"
                className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                {t.study.filterLimit}
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm font-mono-tabular"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}

        {mode === "practice" && (
          <div className="mb-3 px-3 py-2 rounded border border-[var(--border-paper)] bg-[var(--bg-recessed)] text-xs text-[var(--ink-secondary)]">
            {t.study.practiceNotice}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 rounded border border-[var(--rule-crimson)] bg-[var(--rule-crimson-soft)] text-sm text-[var(--rule-crimson)]">
            {error}
          </div>
        )}
      </div>

      {/* Main Flashcard Area */}
      {loading ? (
        <div className="index-stack p-10 my-auto text-center text-sm text-[var(--ink-muted)]">
          {t.common.loading}
        </div>
      ) : !currentCard ? (
        <div className="index-stack crimson-top-rule p-6 sm:p-8 my-auto text-center max-w-lg mx-auto w-full space-y-4">
          <CheckCircle2 className="w-11 h-11 text-[var(--accent-cobalt)] mx-auto" />
          <div>
            <h2 className="font-serif-card text-2xl font-semibold mb-1">
              {t.study.sessionCompleteTitle}
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              {t.study.sessionCompleteSub}
            </p>
          </div>

          {reviewedInSession > 0 && (
            <div className="inline-block px-3.5 py-1.5 rounded-full bg-[var(--accent-cobalt-soft)] border border-[var(--border-paper)] text-xs font-mono-tabular text-[var(--accent-cobalt)]">
              {t.study.reviewedCount}: <strong>{reviewedInSession}</strong>
            </div>
          )}

          {/* Live Countdown to Next Due Card */}
          {nextDueMs !== null && nextDueMs > nowMs && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)] space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--ink-secondary)]">
                <Clock className="w-4 h-4 text-[var(--accent-purple)]" />
                <span>{t.study.nextDueIn}</span>
                <strong className="font-mono-tabular text-base text-[var(--accent-cobalt)]">
                  {formatCountdown(nextDueMs - nowMs)}
                </strong>
              </div>
              {learningWaitingCount > 0 && (
                <p className="text-xs text-[var(--ink-muted)]">
                  {learningWaitingCount} {t.study.learningWaiting}
                </p>
              )}
            </div>
          )}

          {manualCheckNotice && (
            <div className="p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--accent-purple-soft)] text-xs text-[var(--ink-primary)] text-left">
              {manualCheckNotice}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            {upcomingCards.length > 0 && (
              <button
                type="button"
                onClick={() => setMode("ahead")}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-lg bg-[var(--accent-cobalt)] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <FastForward className="w-4 h-4" />
                <span>
                  {t.study.studyAheadAction} ({upcomingCards.length})
                </span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMode("due");
                  void loadStudyQueue(true);
                }}
                className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[var(--accent-cobalt)]" />
                <span>{t.study.reloadQueue}</span>
              </button>

              {upcomingCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode("practice")}
                  className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-card)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[var(--accent-purple)]" />
                  <span>{t.study.startPracticeInstead}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="my-auto flex flex-col gap-3">
          {/* 3D Flipping Flashcard Scene */}
          <div
            role="button"
            tabIndex={0}
            aria-label={flipped ? t.study.backSide : t.study.frontSide}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
            className="card-flip-scene cursor-pointer select-none"
          >
            <div
              key={currentCard.id}
              className={`card-flip-inner ${flipped ? "is-flipped" : ""}`}
            >
              {/* FRONT FACE (0deg) — Peony Pink Top Rule */}
              <div className="card-face card-face-front index-stack bristol-ruled crimson-top-rule p-5 sm:p-8">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-[var(--ink-secondary)] truncate">
                      {deckNameMap[currentCard.deck_id] || "Talia"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--accent-cobalt-soft)] border border-[var(--border-paper)] font-mono-tabular text-[var(--accent-cobalt)]">
                      {t.ledger.states[currentCard.state] || currentCard.state}
                    </span>
                  </div>

                  <span className="font-mono-tabular text-[var(--ink-muted)] shrink-0">
                    EF {currentCard.ease_factor.toFixed(2)} ·{" "}
                    {currentCard.interval_days}d
                  </span>
                </div>

                <div className="py-6 my-auto text-left overflow-y-auto">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)] text-xs font-semibold mb-3">
                    {t.study.frontSide}
                  </span>
                  <p className="font-serif-card text-2xl sm:text-3xl md:text-4xl leading-snug text-[var(--ink-primary)] whitespace-pre-wrap max-w-[65ch]">
                    {currentCard.front}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-paper)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {currentCard.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[var(--accent-cobalt)] font-semibold flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.study.tapToFlip}
                  </span>
                </div>
              </div>

              {/* BACK FACE (180deg) — Electric Orchid Purple Top Rule */}
              <div className="card-face card-face-back index-stack bristol-ruled purple-top-rule p-5 sm:p-8">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)] text-xs">
                  <span className="font-serif-card italic text-[var(--ink-secondary)] truncate max-w-[70%]">
                    {currentCard.front}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-semibold shrink-0">
                    {t.study.backSide}
                  </span>
                </div>

                <div className="py-6 my-auto text-left overflow-y-auto">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] text-xs font-semibold mb-3">
                    {t.study.backSide}
                  </span>
                  <p className="font-serif-card text-xl sm:text-2xl md:text-3xl leading-relaxed text-[var(--ink-primary)] whitespace-pre-wrap max-w-[65ch]">
                    {currentCard.back}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-paper)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {currentCard.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[var(--ink-muted)] font-medium flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.study.frontSide}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Review Telemetry Strip */}
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

      {/* Bottom Thumb-Zone Action Bar */}
      {currentCard && (
        <div className="sticky bottom-16 md:bottom-4 z-10 pt-2">
          {isSm2Mode ? (
            !flipped ? (
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="w-full min-h-[54px] rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-base shadow-md cursor-pointer"
              >
                {t.study.tapToFlip}
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(RATING_AGAIN)}
                  className="min-h-[60px] p-2 rounded-xl border-2 border-[var(--rule-crimson)] bg-[var(--bg-card)] hover:bg-[var(--rule-crimson-soft)] flex flex-col items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--rule-crimson)]">
                    {previews?.again.label}
                  </span>
                  <span className="text-sm font-bold text-[var(--ink-primary)]">
                    1 · {t.study.ratings.again}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(RATING_HARD)}
                  className="min-h-[60px] p-2 rounded-xl border-2 border-[var(--amber-hard)] bg-[var(--bg-card)] hover:bg-[var(--amber-hard-soft)] flex flex-col items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--amber-hard)]">
                    {previews?.hard.label}
                  </span>
                  <span className="text-sm font-bold text-[var(--ink-primary)]">
                    2 · {t.study.ratings.hard}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(RATING_GOOD)}
                  className="min-h-[60px] p-2 rounded-xl border-2 border-[var(--stamp-verdigris)] bg-[var(--bg-card)] hover:bg-[var(--stamp-verdigris-soft)] flex flex-col items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--stamp-verdigris)]">
                    {previews?.good.label}
                  </span>
                  <span className="text-sm font-bold text-[var(--ink-primary)]">
                    3 · {t.study.ratings.good}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(RATING_EASY)}
                  className="min-h-[60px] p-2 rounded-xl border-2 border-[var(--accent-cobalt)] bg-[var(--bg-card)] hover:bg-[var(--accent-cobalt-soft)] flex flex-col items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-cobalt)]">
                    {previews?.easy.label}
                  </span>
                  <span className="text-sm font-bold text-[var(--ink-primary)]">
                    4 · {t.study.ratings.easy}
                  </span>
                </button>
              </div>
            )
          ) : (
            /* Free Practice Navigation Controls */
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((i) => Math.max(0, i - 1));
                }}
                className="min-h-[52px] rounded-xl border border-[var(--border-paper)] bg-[var(--bg-card)] font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.study.prevCard}</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="min-h-[52px] rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-sm"
              >
                {flipped ? t.study.frontSide : t.study.backSide}
              </button>

              <button
                type="button"
                disabled={currentIndex >= cards.length - 1}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
                }}
                className="min-h-[52px] rounded-xl border border-[var(--border-paper)] bg-[var(--bg-card)] font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <span>{t.study.nextCard}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
