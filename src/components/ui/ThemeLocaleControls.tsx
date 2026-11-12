"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";

interface ThemeLocaleControlsProps {
  verboseLocale?: boolean;
}

export function ThemeLocaleControls({
  verboseLocale = false,
}: ThemeLocaleControlsProps) {
  const { locale, darkMode, toggleLocale, toggleDarkMode } = usePreferences();

  const btnSize = verboseLocale
    ? "min-h-[38px] px-2.5 py-1.5 bg-[var(--bg-card)]"
    : "min-h-[34px] px-2 py-1 bg-[var(--bg-elevated)]";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleLocale}
        className={`${btnSize} rounded border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-primary)] cursor-pointer`}
      >
        {verboseLocale
          ? locale === "pl"
            ? "PL / EN"
            : "EN / PL"
          : locale.toUpperCase()}
      </button>

      <button
        type="button"
        onClick={toggleDarkMode}
        className={`${
          verboseLocale
            ? "min-h-[38px] min-w-[38px] p-2 bg-[var(--bg-card)]"
            : "min-h-[34px] min-w-[34px] p-1.5 bg-[var(--bg-elevated)]"
        } rounded border border-[var(--border-paper)] text-[var(--ink-primary)] flex items-center justify-center cursor-pointer`}
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <Sun className={verboseLocale ? "w-4 h-4" : "w-3.5 h-3.5"} />
        ) : (
          <Moon className={verboseLocale ? "w-4 h-4" : "w-3.5 h-3.5"} />
        )}
      </button>
    </div>
  );
}
