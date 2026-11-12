"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import type { EditableCandidate } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface CandidateCardItemProps {
  item: EditableCandidate;
  index: number;
  onUpdate: (id: string, patch: Partial<EditableCandidate>) => void;
  onRemove: (id: string) => void;
}

export function CandidateCardItem({
  item,
  index,
  onUpdate,
  onRemove,
}: CandidateCardItemProps) {
  const { t } = usePreferences();

  return (
    <div
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
              onUpdate(item.id, { selected: e.target.checked })
            }
            className="w-4 h-4 accent-[var(--accent-cobalt)]"
          />
          <span>#{index + 1}</span>
        </label>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
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
            onChange={(e) => onUpdate(item.id, { front: e.target.value })}
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
            onChange={(e) => onUpdate(item.id, { back: e.target.value })}
            className="w-full p-2 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-sm font-serif-card"
          />
        </div>
      </div>
    </div>
  );
}
