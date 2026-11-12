"use client";

import React, { useState } from "react";
import type { Deck, WorkspaceTab } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { AuthGate } from "@/components/auth/AuthGate";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { StatsOverviewCard } from "@/components/decks/StatsOverviewCard";
import { DecksCatalog } from "@/components/decks/DecksCatalog";
import { EditDeckModal } from "@/components/decks/EditDeckModal";
import { DeckDetailView } from "@/components/decks/DeckDetailView";
import { StudySessionView } from "@/components/study/StudySessionView";
import { PhotoScanWorkbench } from "@/components/scan/PhotoScanWorkbench";

export default function FiszkiWorkspacePage() {
  const { isAuthenticated, authHydrated, signOut } = useAuth();
  const { hydrated: prefsHydrated, t } = usePreferences();
  const {
    decks,
    stats,
    dueNowCount,
    loadingWorkspace,
    loadWorkspaceData,
    createDeck,
    updateDeck,
    deleteDeck,
    addDeckLocally,
    replaceDeckLocally,
    resetWorkspaceData,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [openedDeckId, setOpenedDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string>("");
  const [studyMode, setStudyMode] = useState<"due" | "practice">("due");
  const [scanDefaultDeckId, setScanDefaultDeckId] = useState<
    string | undefined
  >(undefined);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  if (!prefsHydrated || !authHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  const openedDeck = decks.find((d) => d.id === openedDeckId) || null;
  const screenKey = openedDeck ? `deck-${openedDeck.id}` : `tab-${activeTab}`;

  function handleSelectTab(tab: WorkspaceTab) {
    setOpenedDeckId(null);
    if (tab === "study") {
      setStudyDeckId("");
      setStudyMode("due");
    }
    setActiveTab(tab);
  }

  function handleStartStudyForDeck(deckId: string, mode: "due" | "practice") {
    setStudyDeckId(deckId);
    setStudyMode(mode);
    setOpenedDeckId(null);
    setActiveTab("study");
  }

  async function handleLogout() {
    await signOut();
    resetWorkspaceData();
    setOpenedDeckId(null);
  }

  async function handleCreateDeck(name: string, description: string) {
    const created = await createDeck(name, description);
    setOpenedDeckId(created.id);
    setActiveTab("decks");
  }

  async function handleDeleteDeck(deckToDelete: Deck) {
    if (!window.confirm(t.decks.confirmDelete)) return;
    await deleteDeck(deckToDelete.id);
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20 md:pb-8">
      <WorkspaceHeader
        activeTab={activeTab}
        hasOpenedDeck={Boolean(openedDeckId)}
        dueNowCount={dueNowCount}
        onSelectTab={handleSelectTab}
        onLogout={() => void handleLogout()}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-5">
        <div key={screenKey} className="screen-transition-stage">
          {openedDeck ? (
            <DeckDetailView
              deck={openedDeck}
              onBack={() => setOpenedDeckId(null)}
              onStartStudy={handleStartStudyForDeck}
              onOpenScanForDeck={(deckId) => {
                setScanDefaultDeckId(deckId);
                setOpenedDeckId(null);
                setActiveTab("scan");
              }}
              onDeckUpdated={replaceDeckLocally}
              onDeckDeleted={() => {
                setOpenedDeckId(null);
                void loadWorkspaceData();
              }}
              onDataChanged={() => void loadWorkspaceData()}
            />
          ) : activeTab === "study" ? (
            <StudySessionView
              decks={decks}
              initialDeckId={studyDeckId}
              initialMode={studyMode}
              onSessionReviewed={() => void loadWorkspaceData()}
            />
          ) : activeTab === "scan" ? (
            <PhotoScanWorkbench
              decks={decks}
              defaultDeckId={scanDefaultDeckId}
              onDeckCreated={addDeckLocally}
              onCardsSaved={(targetId) => {
                void loadWorkspaceData();
                setOpenedDeckId(targetId);
                setActiveTab("decks");
              }}
            />
          ) : (
            <div className="space-y-6">
              {activeTab === "overview" && (
                <StatsOverviewCard
                  dueNowCount={dueNowCount}
                  stats={stats}
                  onStartDueStudy={() => handleSelectTab("study")}
                  onOpenScan={() => {
                    setScanDefaultDeckId(decks[0]?.id);
                    setActiveTab("scan");
                  }}
                />
              )}

              <DecksCatalog
                decks={decks}
                loading={loadingWorkspace}
                onOpenDeck={setOpenedDeckId}
                onCreateDeck={handleCreateDeck}
                onEditDeck={setEditingDeck}
                onDeleteDeck={(d) => void handleDeleteDeck(d)}
                onStartStudy={handleStartStudyForDeck}
                onOpenScan={() => setActiveTab("scan")}
              />
            </div>
          )}
        </div>
      </main>

      <MobileNavBar
        activeTab={activeTab}
        hasOpenedDeck={Boolean(openedDeckId)}
        dueNowCount={dueNowCount}
        onSelectTab={handleSelectTab}
      />

      {editingDeck && (
        <EditDeckModal
          deck={editingDeck}
          onSave={async (id, name, desc) => {
            await updateDeck(id, name, desc);
          }}
          onClose={() => setEditingDeck(null)}
        />
      )}
    </div>
  );
}
