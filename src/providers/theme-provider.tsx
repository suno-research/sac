"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "sac-theme";

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  mq.addEventListener("change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    mq.removeEventListener("change", handler);
  };
}

function applyTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event("storage"));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((t: Theme) => applyTheme(t), []);
  const toggleTheme = useCallback(
    () => applyTheme(theme === "light" ? "dark" : "light"),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
