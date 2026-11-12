"use client";

import React from "react";
import { Camera, Play } from "lucide-react";
import type { StudyStatsOverview } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface StatsOverviewCardProps {
  dueNowCount: number;
  stats: StudyStatsOverview | null;
  onStartDueStudy: () => void;
  onOpenScan: () => void;
}

export function StatsOverviewCard({
  dueNowCount,
  stats,
  onStartDueStudy,
  onOpenScan,
}: StatsOverviewCardProps) {
  const { t } = usePreferences();

  return (
    <section className="index-stack crimson-top-rule p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[var(--accent-cobalt)] block">
            {t.ledger.dueNow}
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-serif-card text-4xl sm:text-5xl font-semibold font-mono-tabular text-[var(--ink-primary)]">
              {dueNowCount}
            </span>
            <span className="text-sm text-[var(--ink-secondary)]">
              {dueNowCount === 0
                ? t.ledger.allCaughtUp
                : `${t.decks.cardsTotal}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onStartDueStudy}
            className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.ledger.startDueSession}</span>
          </button>

          <button
            type="button"
            onClick={onOpenScan}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[var(--accent-cobalt)]" />
            <span>{t.nav.scan}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[var(--border-paper)]">
        <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
          <span className="text-[11px] text-[var(--ink-muted)] block truncate">
            {t.ledger.reviewsToday}
          </span>
          <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--ink-primary)] mt-0.5 block">
            {stats?.reviews_today ?? 0}
          </strong>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
          <span className="text-[11px] text-[var(--ink-muted)] block truncate">
            {t.ledger.streakDays}
          </span>
          <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--ink-primary)] mt-0.5 block">
            {stats?.current_streak_days ?? 0}d
          </strong>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
          <span className="text-[11px] text-[var(--ink-muted)] block truncate">
            {t.ledger.retentionRate}
          </span>
          <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--accent-purple)] mt-0.5 block">
            {Math.round(stats?.retention_rate_percent ?? 0)}%
          </strong>
        </div>
      </div>
    </section>
  );
}
