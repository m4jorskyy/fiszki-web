"use client";

import React from "react";
import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";

interface DeckMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  buttonSizeClass?: string;
}

export function DeckMenu({
  open,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  buttonSizeClass = "min-h-[32px] min-w-[32px] p-1.5",
}: DeckMenuProps) {
  const { t } = usePreferences();

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Deck options"
        className={`${buttonSizeClass} rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--ink-primary)] flex items-center justify-center cursor-pointer`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <div className="absolute right-0 mt-1.5 w-48 z-40 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-lg py-1.5 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--accent-cobalt-soft)] flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--accent-cobalt)]" />
              <span>{t.decks.editTitle}</span>
            </button>

            <div className="my-1 border-t border-[var(--border-paper)]" />

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--rule-crimson)] hover:bg-[var(--rule-crimson-soft)] flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.decks.deleteAction}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
