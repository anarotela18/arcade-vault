"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createElement } from "react";

export interface User {
  name: string;
}

const STORAGE_KEY = "av_user";

function readUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

interface UserContextValue {
  user: User | null;
  login: (u: User) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(readUser());
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return createElement(UserContext.Provider, { value: { user, login, signOut } }, children);
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
