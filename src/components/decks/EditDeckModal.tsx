"use client";

import React, { useEffect, useState } from "react";
import type { Deck } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { Modal } from "@/components/ui/Modal";

interface EditDeckModalProps {
  deck: Deck;
  onSave: (deckId: string, name: string, description: string) => Promise<void>;
  onClose: () => void;
}

export function EditDeckModal({ deck, onSave, onClose }: EditDeckModalProps) {
  const { t } = usePreferences();
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(deck.name);
    setDescription(deck.description);
  }, [deck]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(deck.id, name, description);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t.decks.editTitle} onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
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
            className="w-full min-h-[42px] px-3 py-1.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
            {t.decks.descLabel}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.decks.descPlaceholder}
            className="w-full p-2.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-1.5 rounded-lg border border-[var(--border-paper)] text-xs font-semibold cursor-pointer"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="min-h-[42px] px-5 py-1.5 rounded-lg bg-[var(--accent-cobalt)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {t.decks.saveAction}
          </button>
        </div>
      </form>
    </Modal>
  );
}
