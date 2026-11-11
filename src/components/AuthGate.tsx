"use client";

import React, { useState } from "react";
import {
  BackendConnectionConfig,
  BackendEnv,
  HealthStatus,
} from "@/lib/types";
import { fiszkiApi, StoredSession } from "@/lib/api";
import { Locale, translations } from "@/lib/i18n";
import {
  Server,
  Moon,
  Sun,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface AuthGateProps {
  locale: Locale;
  onToggleLocale: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  health: HealthStatus | null;
  backendConfig: BackendConnectionConfig;
  onUpdateBackendConfig: (cfg: BackendConnectionConfig) => void;
  onRefreshHealth: () => void;
  onAuthenticated: (session: StoredSession) => void;
}

export function AuthGate({
  locale,
  onToggleLocale,
  darkMode,
  onToggleDarkMode,
  health,
  backendConfig,
  onUpdateBackendConfig,
  onRefreshHealth,
  onAuthenticated,
}: AuthGateProps) {
  const t = translations[locale];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnvConfig, setShowEnvConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(
    backendConfig.customUrl || "http://localhost:8080"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session =
        mode === "login"
          ? await fiszkiApi.login(email.trim(), password)
          : await fiszkiApi.register(email.trim(), password);
      onAuthenticated(session);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectEnv(env: BackendEnv) {
    const nextCfg: BackendConnectionConfig = {
      env,
      customUrl: env === "custom" ? customUrlInput.trim() : undefined,
    };
    onUpdateBackendConfig(nextCfg);
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between px-4 py-6 sm:px-6">
      {/* Top Minimal Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[var(--ink-primary)] text-[var(--bg-card)] flex items-center justify-center font-serif-card font-semibold text-lg">
            F
          </div>
          <div>
            <span className="font-serif-card font-semibold text-lg tracking-tight block leading-none">
              Fiszki
            </span>
            <span className="text-xs text-[var(--ink-muted)] block mt-0.5">
              {t.brandSub}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowEnvConfig((v) => !v)}
            className="min-h-[38px] px-2.5 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-xs font-mono-tabular flex items-center gap-1.5 text-[var(--ink-secondary)] hover:border-[var(--border-strong)]"
            title={t.env.configureTitle}
          >
            {health?.status === "ok" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--stamp-verdigris)] shrink-0" />
            ) : health?.status === "db_unreachable" ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--amber-hard)] shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[var(--rule-crimson)] shrink-0" />
            )}
            <span>
              {backendConfig.env === "prod"
                ? "PROD"
                : backendConfig.env === "staging"
                  ? "STAGING"
                  : "CUSTOM"}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleLocale}
            className="min-h-[38px] px-2.5 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--ink-primary)]"
          >
            {locale === "pl" ? "PL / EN" : "EN / PL"}
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="min-h-[38px] min-w-[38px] p-2 rounded border border-[var(--border-paper)] bg-[var(--bg-card)] text-[var(--ink-primary)] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Direct Auth Gate Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        {showEnvConfig && (
          <div className="index-card p-4 mb-4 border-l-4 border-l-[var(--accent-cobalt)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Server className="w-4 h-4 text-[var(--accent-cobalt)]" />
                <span>{t.env.configureTitle}</span>
              </div>
              <button
                type="button"
                onClick={onRefreshHealth}
                className="text-xs font-mono-tabular text-[var(--accent-cobalt)] flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                {t.env.checkHealth}
              </button>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mb-3">
              {t.env.configureDesc}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {(["staging", "prod", "custom"] as BackendEnv[]).map((envKey) => (
                <button
                  key={envKey}
                  type="button"
                  onClick={() => handleSelectEnv(envKey)}
                  className={`py-2 px-2 rounded text-xs font-medium border text-center transition-colors ${
                    backendConfig.env === envKey
                      ? "bg-[var(--accent-cobalt)] text-white border-[var(--accent-cobalt)]"
                      : "bg-[var(--bg-recessed)] text-[var(--ink-secondary)] border-[var(--border-paper)]"
                  }`}
                >
                  {envKey === "staging"
                    ? "Staging (:8081)"
                    : envKey === "prod"
                      ? "Prod (:8080)"
                      : "Custom"}
                </button>
              ))}
            </div>

            {backendConfig.env === "custom" && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="flex-1 px-3 py-2 text-xs font-mono-tabular rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)]"
                />
                <button
                  type="button"
                  onClick={() => handleSelectEnv("custom")}
                  className="px-3 py-2 text-xs font-semibold rounded bg-[var(--ink-primary)] text-[var(--bg-card)]"
                >
                  {t.env.saveEnv}
                </button>
              </div>
            )}

            {health && (
              <div className="mt-2 pt-2 border-t border-[var(--border-paper)] flex items-center justify-between text-xs font-mono-tabular text-[var(--ink-muted)]">
                <span className="truncate">{health.targetUrl}</span>
                <span>
                  {health.status === "ok"
                    ? `${t.env.serverOnline}${
                        health.latencyMs !== undefined
                          ? ` (${health.latencyMs}ms)`
                          : ""
                      }`
                    : health.status === "db_unreachable"
                      ? t.env.dbUnreachable
                      : t.env.serverOffline}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="index-stack crimson-top-rule p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-serif-card text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] tracking-tight">
              {t.auth.gateTitle}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
              {t.auth.gateSubtitle}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 rounded bg-[var(--bg-recessed)] border border-[var(--border-paper)] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`min-h-[42px] rounded text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-xs"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              {t.auth.signInTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`min-h-[42px] rounded text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-xs"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              {t.auth.registerTab}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded border border-[var(--rule-crimson)] bg-[var(--rule-crimson-soft)] text-sm text-[var(--rule-crimson)] font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
