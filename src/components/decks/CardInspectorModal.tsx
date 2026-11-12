"use client";

import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Card } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { Modal } from "@/components/ui/Modal";

interface CardInspectorModalProps {
  card: Card;
  saving: boolean;
  onSave: (front: string, back: string, tagsText: string) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onClose: () => void;
}

export function CardInspectorModal({
  card,
  saving,
  onSave,
  onDelete,
  onClose,
}: CardInspectorModalProps) {
  const { locale, t } = usePreferences();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [tagsText, setTagsText] = useState((card.tags || []).join(", "));

  useEffect(() => {
    setFront(card.front);
    setBack(card.back);
    setTagsText((card.tags || []).join(", "));
  }, [card]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSave(front, back, tagsText);
  }

  return (
    <Modal
      title={t.cards.editCard}
      onClose={onClose}
      maxWidthClass="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.frontLabel}
          </label>
          <textarea
            rows={3}
            required
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] font-serif-card text-base"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.backLabel}
          </label>
          <textarea
            rows={3}
            required
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] font-serif-card text-base"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.tagsLabel}
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>

        <div className="p-3 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] space-y-1.5">
          <span className="block text-xs font-semibold text-[var(--ink-secondary)]">
            {t.cards.inspectTitle}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono-tabular">
            <div>
              <span className="text-[var(--ink-muted)] block">State</span>
              <strong>{card.state}</strong>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block">
                {t.cards.interval}
              </span>
              <strong>{card.interval_days}d</strong>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block">
                {t.cards.easeFactor}
              </span>
              <strong>{card.ease_factor.toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block">
                {t.cards.repetitions}
              </span>
              <strong>{card.repetitions}</strong>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block">
                {t.cards.lapses}
              </span>
              <strong>{card.lapses}</strong>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block">
                {t.cards.step}
              </span>
              <strong>{card.step}</strong>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[var(--border-paper)] text-[11px] font-mono-tabular text-[var(--ink-muted)] flex flex-wrap justify-between gap-2">
            <span>
              {t.cards.dueAt}:{" "}
              {new Date(card.due_at).toLocaleString(
                locale === "pl" ? "pl-PL" : "en-US"
              )}
            </span>
            <span>
              {t.cards.lastReviewed}:{" "}
              {card.last_reviewed_at
                ? new Date(card.last_reviewed_at).toLocaleString(
                    locale === "pl" ? "pl-PL" : "en-US"
                  )
                : t.cards.neverReviewed}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => void onDelete(card.id)}
            className="min-h-[44px] px-3.5 py-2 rounded border border-[var(--rule-crimson)] text-[var(--rule-crimson)] text-xs font-semibold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.cards.deleteCard}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded border border-[var(--border-paper)] text-xs font-semibold"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-xs font-semibold"
            >
              {t.cards.saveCard}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
