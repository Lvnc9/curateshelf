"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type Profile } from "./api";

type AuthState = {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("cs_access");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      localStorage.removeItem("cs_access");
      localStorage.removeItem("cs_refresh");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.login(email, password);
    localStorage.setItem("cs_access", tokens.access);
    localStorage.setItem("cs_refresh", tokens.refresh);
    const me = await api.me();
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string, username?: string) => {
    const res = await api.register({ email, password, username });
    localStorage.setItem("cs_access", res.access);
    localStorage.setItem("cs_refresh", res.refresh);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cs_access");
    localStorage.removeItem("cs_refresh");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}