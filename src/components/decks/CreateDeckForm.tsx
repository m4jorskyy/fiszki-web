"use client";

import React, { useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";

interface CreateDeckFormProps {
  onCreate: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateDeckForm({ onCreate, onCancel }: CreateDeckFormProps) {
  const { t } = usePreferences();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(name, description);
      setName("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="index-card p-4 space-y-3 border-l-4 border-l-[var(--accent-cobalt)]"
    >
      <h3 className="font-serif-card text-base font-semibold">
        {t.decks.createTitle}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.decks.nameLabel}
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.decks.namePlaceholder}
            className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.decks.descLabel}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.decks.descPlaceholder}
            className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-3.5 py-1.5 rounded border border-[var(--border-paper)] text-xs font-semibold"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="min-h-[40px] px-4 py-1.5 rounded bg-[var(--accent-cobalt)] text-white text-xs font-semibold"
        >
          {t.decks.createAction}
        </button>
      </div>
    </form>
  );
}
