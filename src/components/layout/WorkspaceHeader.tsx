"use client";

import React from "react";
import {
  Camera,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  LogOut,
} from "lucide-react";
import type { WorkspaceTab } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeLocaleControls } from "@/components/ui/ThemeLocaleControls";

interface WorkspaceHeaderProps {
  activeTab: WorkspaceTab;
  hasOpenedDeck: boolean;
  dueNowCount: number;
  onSelectTab: (tab: WorkspaceTab) => void;
  onLogout: () => void;
}

export function WorkspaceHeader({
  activeTab,
  hasOpenedDeck,
  dueNowCount,
  onSelectTab,
  onLogout,
}: WorkspaceHeaderProps) {
  const { t } = usePreferences();

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    badge?: number;
  }> = [
    {
      id: "overview",
      label: t.nav.overview,
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      isActive: activeTab === "overview" && !hasOpenedDeck,
    },
    {
      id: "decks",
      label: t.nav.decks,
      icon: <FolderKanban className="w-3.5 h-3.5" />,
      isActive: activeTab === "decks" || hasOpenedDeck,
    },
    {
      id: "study",
      label: t.nav.study,
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      isActive: activeTab === "study" && !hasOpenedDeck,
      badge: dueNowCount > 0 ? dueNowCount : undefined,
    },
    {
      id: "scan",
      label: t.nav.scan,
      icon: <Camera className="w-3.5 h-3.5" />,
      isActive: activeTab === "scan" && !hasOpenedDeck,
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-paper)] bg-[var(--bg-card)]/95 backdrop-blur-xs">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectTab("overview")}
            className="text-left cursor-pointer"
          >
            <BrandMark title="NIHAOWU" compact />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  item.isActive
                    ? "bg-[var(--ink-primary)] text-[var(--bg-card)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[var(--rule-crimson)] text-white font-mono-tabular text-[10px]">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeLocaleControls />

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[34px] px-2.5 py-1 rounded border border-[var(--border-paper)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--rule-crimson)] flex items-center gap-1"
            title={t.nav.logout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.nav.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
