"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Deck, StudyStatsOverview } from "@/lib/types";
import {
  clearStoredSession,
  fiszkiApi,
  getStoredSession,
  StoredSession,
} from "@/lib/api";
import { Locale, translations } from "@/lib/i18n";
import { AuthGate } from "@/components/AuthGate";
import { StudySessionView } from "@/components/StudySessionView";
import { PhotoScanWorkbench } from "@/components/PhotoScanWorkbench";
import { DeckDetailView } from "@/components/DeckDetailView";
import {
  LayoutGrid,
  FolderKanban,
  GraduationCap,
  Camera,
  Plus,
  Play,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  X,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";

type ActiveTab = "overview" | "decks" | "study" | "scan";

export default function FiszkiWorkspacePage() {
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocale] = useState<Locale>("pl");
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [session, setSession] = useState<StoredSession | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Workspace data
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStatsOverview | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);

  // Drill-down states
  const [openedDeckId, setOpenedDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string>("");
  const [studyMode, setStudyMode] = useState<"due" | "practice">("due");
  const [scanDefaultDeckId, setScanDefaultDeckId] = useState<
    string | undefined
  >(undefined);

  // Create Deck Sheet state
  const [showCreateDeck, setShowCreateDeck] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [newDeckDesc, setNewDeckDesc] = useState<string>("");
  const [creatingDeck, setCreatingDeck] = useState<boolean>(false);

  // Deck Card three-dots dropdown & edit modal state
  const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editDeckNameDraft, setEditDeckNameDraft] = useState<string>("");
  const [editDeckDescDraft, setEditDeckDescDraft] = useState<string>("");
  const [savingDeckEdit, setSavingDeckEdit] = useState<boolean>(false);

  const t = translations[locale];

  const loadWorkspaceData = useCallback(async () => {
    setLoadingWorkspace(true);
    try {
      const [decksList, statsData, me] = await Promise.all([
        fiszkiApi.listDecks(),
        fiszkiApi.getStatsOverview(),
        fiszkiApi.getMe(),
      ]);
      setDecks(decksList);
      setStats(statsData);
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.user.id === me.id && prev.user.email === me.email) {
          return prev;
        }
        return { ...prev, user: me };
      });
    } catch {
      // If session is no longer valid even after refresh attempt, sign out cleanly
      const stillValid = getStoredSession();
      if (!stillValid) {
        setSession(null);
      }
    } finally {
      setLoadingWorkspace(false);
    }
  }, []);

  const handleDeckUpdated = useCallback((updated: Deck) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  }, []);

  const handleDeckDeleted = useCallback(
    (deletedId: string) => {
      setDecks((prev) => prev.filter((d) => d.id !== deletedId));
      setOpenedDeckId(null);
      void loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  // Hydrate preferences, backend env, and auth session
  useEffect(() => {
    const savedLocale = localStorage.getItem("fiszki_locale_v1") as Locale | null;
    if (savedLocale === "pl" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const savedTheme = localStorage.getItem("fiszki_theme_v1");
    // Default to dark mode ("Obsidian Black + Peony Pink + Orchid Purple") unless light mode was explicitly chosen
    const prefersDark = savedTheme ? savedTheme === "dark" : true;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);

    const existingSession = getStoredSession();
    if (existingSession) {
      setSession(existingSession);
    }

    setHydrated(true);
  }, []);

  const isAuthenticated = Boolean(session?.accessToken);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      void loadWorkspaceData();
    }
  }, [hydrated, isAuthenticated, loadWorkspaceData]);

  function handleToggleLocale() {
    const next: Locale = locale === "pl" ? "en" : "pl";
    setLocale(next);
    localStorage.setItem("fiszki_locale_v1", next);
  }

  function handleToggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fiszki_theme_v1", next ? "dark" : "light");
  }

  async function handleLogout() {
    await fiszkiApi.logout();
    clearStoredSession();
    setSession(null);
    setDecks([]);
    setStats(null);
    setOpenedDeckId(null);
  }

  async function handleCreateDeckSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim() || creatingDeck) return;
    setCreatingDeck(true);
    try {
      const created = await fiszkiApi.createDeck(
        newDeckName.trim(),
        newDeckDesc.trim()
      );
      setDecks((prev) => [created, ...prev]);
      setNewDeckName("");
      setNewDeckDesc("");
      setShowCreateDeck(false);
      setOpenedDeckId(created.id);
      setActiveTab("decks");
    } finally {
      setCreatingDeck(false);
    }
  }

  function handleStartStudyForDeck(deckId: string, mode: "due" | "practice") {
    setStudyDeckId(deckId);
    setStudyMode(mode);
    setOpenedDeckId(null);
    setActiveTab("study");
  }

  async function handleSaveDeckModal(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeck || !editDeckNameDraft.trim() || savingDeckEdit) return;
    setSavingDeckEdit(true);
    try {
      const updated = await fiszkiApi.updateDeck(
        editingDeck.id,
        editDeckNameDraft.trim(),
        editDeckDescDraft.trim()
      );
      setDecks((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setEditingDeck(null);
    } finally {
      setSavingDeckEdit(false);
    }
  }

  async function handleDeleteDeckFromList(deckToDelete: Deck) {
    if (!window.confirm(t.decks.confirmDelete)) return;
    await fiszkiApi.deleteDeck(deckToDelete.id);
    setDecks((prev) => prev.filter((d) => d.id !== deckToDelete.id));
    void loadWorkspaceData();
  }

  if (!hydrated) {
    return null;
  }

  if (!session) {
    return (
      <AuthGate
        locale={locale}
        onToggleLocale={handleToggleLocale}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onAuthenticated={(newSession) => setSession(newSession)}
      />
    );
  }

  const openedDeck = decks.find((d) => d.id === openedDeckId) || null;
  const screenKey = openedDeck ? `deck-${openedDeck.id}` : `tab-${activeTab}`;
  const dueNowCount =
    stats?.due_now_count ??
    decks.reduce((acc, d) => acc + (d.counts?.due_cards || 0), 0);

  return (
    <div className="min-h-dvh flex flex-col pb-20 md:pb-8">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-paper)] bg-[var(--bg-card)]/95 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand + Desktop Nav */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setOpenedDeckId(null);
                setActiveTab("overview");
              }}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded bg-[var(--ink-primary)] text-[var(--bg-card)] flex items-center justify-center font-serif-card font-semibold text-base">
                F
              </div>
              <span className="font-serif-card font-semibold text-lg tracking-tight">
                NIHAOWU
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpenedDeckId(null);
                  setActiveTab("overview");
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === "overview" && !openedDeckId
                    ? "bg-[var(--ink-primary)] text-[var(--bg-card)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.nav.overview}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenedDeckId(null);
                  setActiveTab("decks");
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === "decks" || openedDeckId
                    ? "bg-[var(--ink-primary)] text-[var(--bg-card)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{t.nav.decks}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenedDeckId(null);
                  setStudyDeckId("");
                  setStudyMode("due");
                  setActiveTab("study");
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === "study"
                    ? "bg-[var(--ink-primary)] text-[var(--bg-card)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{t.nav.study}</span>
                {dueNowCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[var(--rule-crimson)] text-white font-mono-tabular text-[10px]">
                    {dueNowCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenedDeckId(null);
                  setActiveTab("scan");
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === "scan"
                    ? "bg-[var(--ink-primary)] text-[var(--bg-card)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t.nav.scan}</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: PL/EN, Dark Mode, Logout */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleLocale}
              className="min-h-[34px] px-2 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-semibold cursor-pointer"
            >
              {locale.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={handleToggleDarkMode}
              className="min-h-[34px] min-w-[34px] p-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="min-h-[34px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--rule-crimson)] flex items-center gap-1"
              title={t.nav.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-5">
        <div key={screenKey} className="screen-transition-stage">
        {openedDeck ? (
          <DeckDetailView
            locale={locale}
            deck={openedDeck}
            onBack={() => setOpenedDeckId(null)}
            onStartStudy={handleStartStudyForDeck}
            onOpenScanForDeck={(deckId) => {
              setScanDefaultDeckId(deckId);
              setOpenedDeckId(null);
              setActiveTab("scan");
            }}
            onDeckUpdated={handleDeckUpdated}
            onDeckDeleted={handleDeckDeleted}
            onDataChanged={loadWorkspaceData}
          />
        ) : activeTab === "study" ? (
          <StudySessionView
            locale={locale}
            decks={decks}
            initialDeckId={studyDeckId}
            initialMode={studyMode}
            onSessionReviewed={() => void loadWorkspaceData()}
          />
        ) : activeTab === "scan" ? (
          <PhotoScanWorkbench
            locale={locale}
            decks={decks}
            defaultDeckId={scanDefaultDeckId}
            onDeckCreated={(created) =>
              setDecks((prev) => [created, ...prev])
            }
            onCardsSaved={(targetId) => {
              void loadWorkspaceData();
              setOpenedDeckId(targetId);
              setActiveTab("decks");
            }}
          />
        ) : (
          /* OVERVIEW & DECKS CATALOG */
          <div className="space-y-6">
            {activeTab === "overview" && (
              /* Calm, Minimal Home Study Card (GET /api/v1/stats/overview) */
              <section className="index-stack crimson-top-rule p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-[var(--accent-cobalt)] block">
                      {t.ledger.dueNow}
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="font-serif-card text-4xl sm:text-5xl font-semibold font-mono-tabular text-[var(--ink-primary)]">
                        {dueNowCount}
                      </span>
                      <span className="text-sm text-[var(--ink-secondary)]">
                        {dueNowCount === 0
                          ? t.ledger.allCaughtUp
                          : `${t.decks.cardsTotal}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setStudyDeckId("");
                        setStudyMode("due");
                        setActiveTab("study");
                      }}
                      className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 rounded-xl bg-[var(--accent-cobalt)] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{t.ledger.startDueSession}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScanDefaultDeckId(decks[0]?.id);
                        setActiveTab("scan");
                      }}
                      className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[var(--accent-cobalt)]" />
                      <span>{t.nav.scan}</span>
                    </button>
                  </div>
                </div>

                {/* Compact 3-Metric Pill Row (No overwhelming graphs) */}
                <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[var(--border-paper)]">
                  <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
                    <span className="text-[11px] text-[var(--ink-muted)] block truncate">
                      {t.ledger.reviewsToday}
                    </span>
                    <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--ink-primary)] mt-0.5 block">
                      {stats?.reviews_today ?? 0}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
                    <span className="text-[11px] text-[var(--ink-muted)] block truncate">
                      {t.ledger.streakDays}
                    </span>
                    <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--ink-primary)] mt-0.5 block">
                      {stats?.current_streak_days ?? 0}d
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-recessed)] border border-[var(--border-paper)]">
                    <span className="text-[11px] text-[var(--ink-muted)] block truncate">
                      {t.ledger.retentionRate}
                    </span>
                    <strong className="font-mono-tabular text-lg sm:text-xl font-semibold text-[var(--accent-purple)] mt-0.5 block">
                      {Math.round(stats?.retention_rate_percent ?? 0)}%
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {/* Decks Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif-card text-xl sm:text-2xl font-semibold">
                  {t.decks.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateDeck((s) => !s)}
                  className="min-h-[42px] px-4 py-2 rounded bg-[var(--ink-primary)] text-[var(--bg-card)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.decks.newDeck}</span>
                </button>
              </div>

              {showCreateDeck && (
                <form
                  onSubmit={handleCreateDeckSubmit}
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
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
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
                        value={newDeckDesc}
                        onChange={(e) => setNewDeckDesc(e.target.value)}
                        placeholder={t.decks.descPlaceholder}
                        className="w-full min-h-[42px] px-3 py-1.5 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateDeck(false)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded border border-[var(--border-paper)] text-xs font-semibold"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={creatingDeck || !newDeckName.trim()}
                      className="min-h-[40px] px-4 py-1.5 rounded bg-[var(--accent-cobalt)] text-white text-xs font-semibold"
                    >
                      {t.decks.createAction}
                    </button>
                  </div>
                </form>
              )}

              {loadingWorkspace && decks.length === 0 ? (
                <div className="index-card p-10 text-center text-sm text-[var(--ink-muted)]">
                  {t.common.loading}
                </div>
              ) : decks.length === 0 ? (
                <div className="index-stack p-8 text-center max-w-md mx-auto">
                  <h3 className="font-serif-card text-xl font-semibold mb-1">
                    {t.decks.emptyTitle}
                  </h3>
                  <p className="text-sm text-[var(--ink-secondary)] mb-5">
                    {t.decks.emptyDesc}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowCreateDeck(true)}
                      className="min-h-[46px] px-4 py-2 rounded bg-[var(--accent-cobalt)] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.decks.newDeck}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("scan")}
                      className="min-h-[46px] px-4 py-2 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-[var(--accent-cobalt)]" />
                      <span>{t.nav.scan}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decks.map((d) => (
                    <article
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenedDeckId(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenedDeckId(d.id);
                        }
                      }}
                      className="index-stack p-5 flex flex-col justify-between gap-4 hover:border-[var(--accent-cobalt)] transition-colors relative cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif-card text-xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-cobalt)] transition-colors">
                            {d.name}
                          </h3>

                          {/* Three-dots Dropdown Menu in Top-Right Corner */}
                          <div
                            className="relative shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuDeckId((cur) =>
                                  cur === d.id ? null : d.id
                                )
                              }
                              aria-label="Deck options"
                              className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--ink-primary)] flex items-center justify-center cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuDeckId === d.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenMenuDeckId(null)}
                                />
                                <div className="absolute right-0 mt-1.5 w-48 z-40 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-lg py-1.5 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuDeckId(null);
                                      setEditingDeck(d);
                                      setEditDeckNameDraft(d.name);
                                      setEditDeckDescDraft(d.description);
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
                                      setOpenMenuDeckId(null);
                                      void handleDeleteDeckFromList(d);
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
                        </div>

                        {d.description && (
                          <p className="text-sm text-[var(--ink-secondary)] mt-1 line-clamp-2">
                            {d.description}
                          </p>
                        )}

                        {/* General card counter + badges moved under description */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-mono-tabular">
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-recessed)] border border-[var(--border-paper)] text-[var(--ink-primary)] font-semibold">
                            {d.counts.total_cards} {t.decks.cardsTotal}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-semibold ${
                              d.counts.due_cards > 0
                                ? "bg-[var(--accent-cobalt-soft)] text-[var(--accent-cobalt)]"
                                : "bg-[var(--bg-recessed)] text-[var(--ink-muted)]"
                            }`}
                          >
                            {d.counts.due_cards} {t.decks.dueBadge}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)]">
                            {d.counts.new_cards} {t.decks.newBadge}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--amber-hard-soft)] text-[var(--amber-hard)]">
                            {d.counts.learning_cards} {t.decks.learningBadge}
                          </span>
                        </div>
                      </div>

                      <div
                        className="pt-3 border-t border-[var(--border-paper)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleStartStudyForDeck(
                              d.id,
                              d.counts.due_cards > 0 ? "due" : "practice"
                            )
                          }
                          className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-[var(--accent-cobalt)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {d.counts.due_cards > 0 ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {t.decks.studyDeck} ({d.counts.due_cards})
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{t.decks.practiceDeck}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Thumb-Bar Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-paper)] bg-[var(--bg-card)]/95 backdrop-blur-xs pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-16">
          <button
            type="button"
            onClick={() => {
              setOpenedDeckId(null);
              setActiveTab("overview");
            }}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold ${
              activeTab === "overview" && !openedDeckId
                ? "text-[var(--accent-cobalt)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>{t.nav.overview}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenedDeckId(null);
              setActiveTab("decks");
            }}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold ${
              activeTab === "decks" || openedDeckId
                ? "text-[var(--accent-cobalt)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span>{t.nav.decks}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenedDeckId(null);
              setStudyDeckId("");
              setStudyMode("due");
              setActiveTab("study");
            }}
            className={`relative flex flex-col items-center justify-center gap-1 text-xs font-semibold ${
              activeTab === "study" && !openedDeckId
                ? "text-[var(--accent-cobalt)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span>{t.nav.study}</span>
            {dueNowCount > 0 && (
              <span className="absolute top-1.5 right-6 px-1.5 rounded-full bg-[var(--rule-crimson)] text-white font-mono-tabular text-[10px]">
                {dueNowCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenedDeckId(null);
              setActiveTab("scan");
            }}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold ${
              activeTab === "scan" && !openedDeckId
                ? "text-[var(--accent-cobalt)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>{t.nav.scan}</span>
          </button>
        </div>
      </nav>

      {/* Edit Deck Title & Description Modal (from Deck Card Three-Dots Menu) */}
      {editingDeck && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md index-card crimson-top-rule rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <h3 className="font-serif-card text-lg font-semibold">
                {t.decks.editTitle}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDeck(null)}
                className="p-1.5 rounded-lg border border-[var(--border-paper)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeckModal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  {t.decks.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editDeckNameDraft}
                  onChange={(e) => setEditDeckNameDraft(e.target.value)}
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
                  value={editDeckDescDraft}
                  onChange={(e) => setEditDeckDescDraft(e.target.value)}
                  placeholder={t.decks.descPlaceholder}
                  className="w-full p-2.5 rounded-lg border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDeck(null)}
                  className="min-h-[42px] px-4 py-1.5 rounded-lg border border-[var(--border-paper)] text-xs font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingDeckEdit || !editDeckNameDraft.trim()}
                  className="min-h-[42px] px-5 py-1.5 rounded-lg bg-[var(--accent-cobalt)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {t.decks.saveAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
