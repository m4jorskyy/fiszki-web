"use client";

import React from "react";
import { PreferencesProvider } from "./PreferencesContext";
import { AuthProvider } from "./AuthContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <AuthProvider>{children}</AuthProvider>
    </PreferencesProvider>
  );
}
