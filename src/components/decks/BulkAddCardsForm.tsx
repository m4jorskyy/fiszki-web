"use client";

import React, { useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";

interface BulkAddCardsFormProps {
  onBulkAdd: (rawText: string) => Promise<boolean>;
}

export function BulkAddCardsForm({ onBulkAdd }: BulkAddCardsFormProps) {
  const { t } = usePreferences();
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkText.trim() || saving) return;
    setSaving(true);
    try {
      const ok = await onBulkAdd(bulkText);
      if (ok) {
        setBulkText("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="index-card p-4 space-y-3">
      <h2 className="font-serif-card text-base font-semibold">
        {t.cards.bulkAddTitle}
      </h2>
      <p className="text-xs text-[var(--ink-secondary)]">{t.cards.bulkHelp}</p>
      <textarea
        rows={5}
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder={t.cards.bulkPlaceholder}
        className="w-full p-3 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm font-mono-tabular"
      />
      <button
        type="submit"
        disabled={saving || !bulkText.trim()}
        className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold disabled:opacity-50"
      >
        {t.cards.bulkSaveAction}
      </button>
    </form>
  );
}
