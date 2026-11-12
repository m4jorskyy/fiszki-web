"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  FastForward,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";
import { formatCountdown } from "@/utils/formatters";
import { Alert } from "@/components/ui/Alert";

interface StudySessionCompleteProps {
  reviewedInSession: number;
  nextDueMs: number | null;
  nowMs: number;
  learningWaitingCount: number;
  upcomingCount: number;
  manualCheckNotice: string | null;
  onStudyAhead: () => void;
  onReloadQueue: () => void;
  onStartPractice: () => void;
}

export function StudySessionComplete({
  reviewedInSession,
  nextDueMs,
  nowMs,
  learningWaitingCount,
  upcomingCount,
  manualCheckNotice,
  onStudyAhead,
  onReloadQueue,
  onStartPractice,
}: StudySessionCompleteProps) {
  const { t } = usePreferences();

  return (
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
        <Alert
          variant="info"
          message={manualCheckNotice}
          className="text-xs text-left rounded-lg"
        />
      )}

      <div className="flex flex-col gap-2.5 pt-2">
        {upcomingCount > 0 && (
          <button
            type="button"
            onClick={onStudyAhead}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg bg-[var(--accent-cobalt)] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <FastForward className="w-4 h-4" />
            <span>
              {t.study.studyAheadAction} ({upcomingCount})
            </span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onReloadQueue}
            className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[var(--accent-cobalt)]" />
            <span>{t.study.reloadQueue}</span>
          </button>

          {upcomingCount > 0 && (
            <button
              type="button"
              onClick={onStartPractice}
              className="w-full sm:flex-1 min-h-[46px] px-4 py-2.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-card)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-purple)]" />
              <span>{t.study.startPracticeInstead}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
