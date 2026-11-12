"use client";

import React, { useRef, useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";

interface QuickAddCardFormProps {
  onAddCard: (front: string, back: string, tagsText: string) => Promise<boolean>;
}

export function QuickAddCardForm({ onAddCard }: QuickAddCardFormProps) {
  const { t } = usePreferences();
  const frontInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!front.trim() || !back.trim() || adding) return;
    setAdding(true);
    try {
      const ok = await onAddCard(front, back, tagsText);
      if (ok) {
        setFront("");
        setBack("");
        frontInputRef.current?.focus();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          void handleSubmit();
        }
      }}
      className="index-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif-card text-base font-semibold">
          {t.cards.quickAddTitle}
        </h2>
        <span className="text-xs text-[var(--ink-muted)] hidden sm:inline">
          {t.cards.shortcutHint}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.frontLabel}
          </label>
          <textarea
            ref={frontInputRef}
            rows={2}
            required
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder={t.cards.frontPlaceholder}
            className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-base font-serif-card"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.backLabel}
          </label>
          <textarea
            rows={2}
            required
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder={t.cards.backPlaceholder}
            className="w-full p-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-base font-serif-card"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.cards.tagsLabel}
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder={t.cards.tagsPlaceholder}
            className="w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={adding || !front.trim() || !back.trim()}
          className="min-h-[44px] px-5 py-2.5 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          {adding ? t.cards.addingCard : t.cards.addCardAction}
        </button>
      </div>
    </form>
  );
}
