"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useUser() {
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

  return { user, login, signOut };
}
