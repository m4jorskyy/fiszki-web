"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Locale, Translations, translations } from "@/i18n";

const PREF_STORAGE_KEYS = {
  LOCALE: "fiszki_locale_v1",
  THEME: "fiszki_theme_v1",
} as const;

interface PreferencesContextValue {
  locale: Locale;
  darkMode: boolean;
  hydrated: boolean;
  t: Translations;
  toggleLocale: () => void;
  toggleDarkMode: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocale] = useState<Locale>("pl");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    const savedLocale = localStorage.getItem(
      PREF_STORAGE_KEYS.LOCALE
    ) as Locale | null;
    if (savedLocale === "pl" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const savedTheme = localStorage.getItem(PREF_STORAGE_KEYS.THEME);
    const prefersDark = savedTheme ? savedTheme === "dark" : true;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
    setHydrated(true);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === "pl" ? "en" : "pl";
      localStorage.setItem(PREF_STORAGE_KEYS.LOCALE, next);
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(PREF_STORAGE_KEYS.THEME, next ? "dark" : "light");
      return next;
    });
  }, []);

  const t = translations[locale];

  return (
    <PreferencesContext.Provider
      value={{
        locale,
        darkMode,
        hydrated,
        t,
        toggleLocale,
        toggleDarkMode,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
