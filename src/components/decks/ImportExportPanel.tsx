"use client";

import React, { useState } from "react";
import { Download, Upload } from "lucide-react";
import type { DeckExportFormat } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface ImportExportPanelProps {
  onExport: (format: DeckExportFormat) => Promise<void>;
  onImport: (format: DeckExportFormat, rawContent: string) => Promise<boolean>;
}

export function ImportExportPanel({
  onExport,
  onImport,
}: ImportExportPanelProps) {
  const { t } = usePreferences();
  const [importFormat, setImportFormat] = useState<DeckExportFormat>("csv");
  const [importRaw, setImportRaw] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importRaw.trim() || importing) return;
    setImporting(true);
    try {
      const ok = await onImport(importFormat, importRaw);
      if (ok) {
        setImportRaw("");
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="index-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-paper)]">
        <h2 className="font-serif-card text-base font-semibold">
          {t.importExport.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onExport("csv")}
            className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.importExport.exportCsv}</span>
          </button>
          <button
            type="button"
            onClick={() => void onExport("json")}
            className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.importExport.exportJson}</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold">
              {t.importExport.formatLabel}:
            </label>
            <select
              value={importFormat}
              onChange={(e) =>
                setImportFormat(e.target.value as DeckExportFormat)
              }
              className="min-h-[38px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-mono-tabular"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <label className="min-h-[38px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[var(--accent-cobalt)]" />
            <span>{t.importExport.uploadFile}</span>
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.name.toLowerCase().endsWith(".json")) {
                  setImportFormat("json");
                } else if (file.name.toLowerCase().endsWith(".csv")) {
                  setImportFormat("csv");
                }
                const text = await file.text();
                setImportRaw(text);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <p className="text-xs text-[var(--ink-muted)] font-mono-tabular">
          {importFormat === "csv"
            ? t.importExport.csvHint
            : t.importExport.jsonHint}
        </p>

        <textarea
          rows={5}
          value={importRaw}
          onChange={(e) => setImportRaw(e.target.value)}
          placeholder={
            importFormat === "csv"
              ? "front,back,tags\nGoroutine,Lightweight thread,go;concurrency"
              : '[{"front":"Goroutine","back":"Lightweight thread","tags":["go"]}]'
          }
          className="w-full p-3 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-mono-tabular"
        />

        <button
          type="submit"
          disabled={importing || !importRaw.trim()}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold disabled:opacity-50"
        >
          {importing
            ? t.importExport.importing
            : t.importExport.importAction}
        </button>
      </form>
    </div>
  );
}
