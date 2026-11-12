"use client";

import React from "react";
import {
  Camera,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
} from "lucide-react";
import type { WorkspaceTab } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";

interface MobileNavBarProps {
  activeTab: WorkspaceTab;
  hasOpenedDeck: boolean;
  dueNowCount: number;
  onSelectTab: (tab: WorkspaceTab) => void;
}

export function MobileNavBar({
  activeTab,
  hasOpenedDeck,
  dueNowCount,
  onSelectTab,
}: MobileNavBarProps) {
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
      icon: <LayoutGrid className="w-5 h-5" />,
      isActive: activeTab === "overview" && !hasOpenedDeck,
    },
    {
      id: "decks",
      label: t.nav.decks,
      icon: <FolderKanban className="w-5 h-5" />,
      isActive: activeTab === "decks" || hasOpenedDeck,
    },
    {
      id: "study",
      label: t.nav.study,
      icon: <GraduationCap className="w-5 h-5" />,
      isActive: activeTab === "study" && !hasOpenedDeck,
      badge: dueNowCount > 0 ? dueNowCount : undefined,
    },
    {
      id: "scan",
      label: t.nav.scan,
      icon: <Camera className="w-5 h-5" />,
      isActive: activeTab === "scan" && !hasOpenedDeck,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-paper)] bg-[var(--bg-card)]/95 backdrop-blur-xs pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center gap-1 text-xs font-semibold ${
              item.isActive
                ? "text-[var(--accent-cobalt)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-1.5 right-6 px-1.5 rounded-full bg-[var(--rule-crimson)] text-white font-mono-tabular text-[10px]">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
