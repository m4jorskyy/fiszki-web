"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { StoredSession, User } from "@/types";
import {
  clearStoredSession,
  getMe,
  getStoredSession,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "@/api";

interface AuthContextValue {
  session: StoredSession | null;
  user: User | null;
  isAuthenticated: boolean;
  authHydrated: boolean;
  signIn: (email: string, password: string) => Promise<StoredSession>;
  signUp: (email: string, password: string) => Promise<StoredSession>;
  signOut: () => Promise<void>;
  syncUser: (user: User) => void;
  clearSessionOnAuthFailure: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [authHydrated, setAuthHydrated] = useState(false);

  useEffect(() => {
    const existingSession = getStoredSession();
    if (existingSession) {
      setSession(existingSession);
      setAuthHydrated(true);
    }

    // Verify / restore session via HttpOnly cookies
    void getMe()
      .then((me) => {
        setSession((prev) => ({
          user: me,
          accessToken: prev?.accessToken || "",
          expiresAt: prev?.expiresAt || "",
          refreshToken: prev?.refreshToken || "",
        }));
      })
      .catch(() => {
        if (!existingSession) {
          setSession(null);
        }
      })
      .finally(() => {
        setAuthHydrated(true);
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const newSession = await loginApi(email.trim(), password);
    setSession(newSession);
    return newSession;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const newSession = await registerApi(email.trim(), password);
    setSession(newSession);
    return newSession;
  }, []);

  const signOut = useCallback(async () => {
    await logoutApi();
    clearStoredSession();
    setSession(null);
  }, []);

  const syncUser = useCallback((me: User) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.user.id === me.id && prev.user.email === me.email) {
        return prev;
      }
      return { ...prev, user: me };
    });
  }, []);

  const clearSessionOnAuthFailure = useCallback(() => {
    const stillValid = getStoredSession();
    if (!stillValid) {
      setSession(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.user),
        authHydrated,
        signIn,
        signUp,
        signOut,
        syncUser,
        clearSessionOnAuthFailure,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
