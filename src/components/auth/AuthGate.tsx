"use client";

import React from "react";
import { usePreferences } from "@/context/PreferencesContext";
import { useAuthForm } from "@/hooks/useAuthForm";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeLocaleControls } from "@/components/ui/ThemeLocaleControls";
import { Alert } from "@/components/ui/Alert";

export function AuthGate() {
  const { t } = usePreferences();
  const {
    mode,
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    switchMode,
    handleSubmit,
  } = useAuthForm();

  return (
    <div className="min-h-dvh flex flex-col justify-between px-4 py-6 sm:px-6">
      <header className="w-full max-w-md mx-auto flex items-center justify-between gap-2">
        <BrandMark title="NIHAOWU" subtitle={t.brandSub} />
        <ThemeLocaleControls verboseLocale />
      </header>

      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="index-stack crimson-top-rule p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-serif-card text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] tracking-tight">
              {t.auth.gateTitle}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
              {t.auth.gateSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] mb-6">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`min-h-[42px] rounded text-sm font-semibold transition-colors cursor-pointer ${
                mode === "login"
                  ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-xs"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              {t.auth.signInTab}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`min-h-[42px] rounded text-sm font-semibold transition-colors cursor-pointer ${
                mode === "register"
                  ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-xs"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              {t.auth.registerTab}
            </button>
          </div>

          {error && <Alert variant="error" message={error} className="mb-4 font-medium" />}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-[var(--ink-primary)] mb-1.5"
              >
                {t.auth.emailLabel}
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] text-base"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-[var(--ink-primary)] mb-1.5"
              >
                {t.auth.passwordLabel}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] text-base"
              />
              {mode === "register" && (
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  {t.auth.passwordHint}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[50px] mt-2 rounded bg-[var(--accent-cobalt)] hover:opacity-95 text-white font-semibold text-base transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? mode === "login"
                  ? t.auth.signingIn
                  : t.auth.registering
                : mode === "login"
                  ? t.auth.signInAction
                  : t.auth.registerAction}
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-md mx-auto text-center text-xs text-[var(--ink-muted)] font-mono-tabular">
        fiszki-server API v1 · SM-2 · Gemini 2.5 Flash
      </footer>
    </div>
  );
}
