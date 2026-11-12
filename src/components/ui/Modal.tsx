"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  title,
  onClose,
  children,
  maxWidthClass = "sm:max-w-md",
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full ${maxWidthClass} max-h-[90dvh] overflow-y-auto index-card crimson-top-rule rounded-t-2xl sm:rounded-2xl p-5 space-y-4`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
          <h3 className="font-serif-card text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg border border-[var(--border-paper)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
