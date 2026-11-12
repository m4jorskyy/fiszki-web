"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Deck,
  Rating,
  RATING_AGAIN,
  RATING_EASY,
  RATING_GOOD,
  RATING_HARD,
  ReviewLog,
  StudyMode,
} from "@/types";
import { getDueCards, listCards, submitReview } from "@/api";
import { usePreferences } from "@/context/PreferencesContext";
import { previewSchedule } from "@/utils/sm2";

interface UseStudySessionOptions {
  decks: Deck[];
  initialDeckId?: string;
  initialMode?: "due" | "practice";
  onSessionReviewed: () => void;
}

export function useStudySession({
  decks,
  initialDeckId = "",
  initialMode = "due",
  onSessionReviewed,
}: UseStudySessionOptions) {
  const { locale, t } = usePreferences();

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

  const decksRef = useRef<Deck[]>(decks);
  useEffect(() => {
    decksRef.current = decks;
  }, [decks]);

  const fetchAllFilteredCards = useCallback(async (): Promise<Card[]> => {
    const tag = selectedTag.trim() || undefined;
    if (selectedDeckId) {
      return listCards(selectedDeckId, { tag });
    }
    const allLists = await Promise.all(
      decksRef.current.map((d) => listCards(d.id, { tag }))
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
          const res = await getDueCards({
            deck_id: selectedDeckId || undefined,
            tag: selectedTag.trim() || undefined,
            limit,
          });
          setCards(res.cards);

          if (res.cards.length === 0) {
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
        const res = await submitReview(currentCard.id, rating);
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

  const toggleFlipped = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const goPrevCard = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNextCard = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
  }, [cards.length]);

  // Keyboard shortcuts: Space/Enter to flip, 1-4 to rate in SM-2 mode, arrows in practice mode
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
        toggleFlipped();
      } else if (flipped && isSm2Mode) {
        if (e.key === "1") void handleRate(RATING_AGAIN);
        if (e.key === "2") void handleRate(RATING_HARD);
        if (e.key === "3") void handleRate(RATING_GOOD);
        if (e.key === "4") void handleRate(RATING_EASY);
      } else if (mode === "practice") {
        if (e.key === "ArrowRight") goNextCard();
        else if (e.key === "ArrowLeft") goPrevCard();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    currentCard,
    flipped,
    isSm2Mode,
    mode,
    handleRate,
    toggleFlipped,
    goNextCard,
    goPrevCard,
  ]);

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

  return {
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
  };
}
