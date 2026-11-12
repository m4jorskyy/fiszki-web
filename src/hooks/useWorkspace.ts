"use client";

import { useCallback, useEffect, useState } from "react";
import type { Deck, StudyStatsOverview } from "@/types";
import {
  createDeck as createDeckApi,
  deleteDeck as deleteDeckApi,
  getMe,
  getStatsOverview,
  listDecks,
  updateDeck as updateDeckApi,
} from "@/api";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";

export function useWorkspace() {
  const { isAuthenticated, authHydrated, syncUser, clearSessionOnAuthFailure } =
    useAuth();
  const { hydrated: prefsHydrated } = usePreferences();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStatsOverview | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);

  const loadWorkspaceData = useCallback(async () => {
    setLoadingWorkspace(true);
    try {
      const [decksList, statsData, me] = await Promise.all([
        listDecks(),
        getStatsOverview(),
        getMe(),
      ]);
      setDecks(decksList);
      setStats(statsData);
      syncUser(me);
    } catch {
      clearSessionOnAuthFailure();
    } finally {
      setLoadingWorkspace(false);
    }
  }, [syncUser, clearSessionOnAuthFailure]);

  useEffect(() => {
    if (prefsHydrated && authHydrated && isAuthenticated) {
      void loadWorkspaceData();
    }
  }, [prefsHydrated, authHydrated, isAuthenticated, loadWorkspaceData]);

  const addDeckLocally = useCallback((created: Deck) => {
    setDecks((prev) => [created, ...prev]);
  }, []);

  const replaceDeckLocally = useCallback((updated: Deck) => {
    setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  const createDeck = useCallback(async (name: string, description: string) => {
    const created = await createDeckApi(name.trim(), description.trim());
    setDecks((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateDeck = useCallback(
    async (deckId: string, name: string, description: string) => {
      const updated = await updateDeckApi(
        deckId,
        name.trim(),
        description.trim()
      );
      setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      return updated;
    },
    []
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      await deleteDeckApi(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      void loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  const resetWorkspaceData = useCallback(() => {
    setDecks([]);
    setStats(null);
  }, []);

  const dueNowCount =
    stats?.due_now_count ??
    decks.reduce((acc, d) => acc + (d.counts?.due_cards || 0), 0);

  return {
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
  };
}
