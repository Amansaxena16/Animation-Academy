"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  api,
  onSessionEnded,
  refreshSession,
  setAccessToken,
  type AuthPayload,
  type SessionUser,
} from "./api";

type Status = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: Status;
  user: SessionUser | null;
  /** Restore the session from the refresh cookie (once; later calls reuse the result). */
  ensureSession: () => Promise<SessionUser | null>;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Holds the signed-in user. Public pages never touch the session, so they don't call
 *  /auth/refresh/ on every visit; dashboards and the login page call ensureSession(). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [user, setUser] = useState<SessionUser | null>(null);
  const restoring = useRef<Promise<SessionUser | null> | null>(null);

  const ensureSession = useCallback(() => {
    restoring.current ??= (async () => {
      setStatus("loading");
      const session = await refreshSession();
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "anonymous");
      return session?.user ?? null;
    })();
    return restoring.current;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await api<AuthPayload>("/auth/login/", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setAccessToken(payload.access);
    setUser(payload.user);
    setStatus("authenticated");
    restoring.current = Promise.resolve(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout/", { method: "POST", auth: false });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("anonymous");
      restoring.current = Promise.resolve(null);
    }
  }, []);

  useEffect(
    () =>
      onSessionEnded(() => {
        setUser(null);
        setStatus("anonymous");
        restoring.current = Promise.resolve(null);
      }),
    [],
  );

  const value = useMemo(
    () => ({ status, user, ensureSession, login, logout }),
    [status, user, ensureSession, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
