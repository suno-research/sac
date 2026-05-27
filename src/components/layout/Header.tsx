"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [pendencias, setPendencias] = useState(0);

  useEffect(() => {
    fetch("/api/acessos")
      .then((r) => r.json())
      .then((acessos) => {
        if (!Array.isArray(acessos)) return;
        const count = acessos.filter(
          (a: { status: string }) =>
            a.status === "Pendente concessão" || a.status === "Pendente remoção"
        ).length;
        setPendencias(count);
      })
      .catch(() => setPendencias(0));
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-8 xl:px-10 border-b border-border bg-card/80 backdrop-blur-md"
      style={{
        left: "var(--sidebar-width)",
        height: "var(--header-height)",
      }}
    >
      <div />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {pendencias > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
          )}
        </button>
        <div className="flex items-center gap-3 pl-4 ml-2 border-l border-border">
          <div className="h-10 w-10 rounded-full bg-accent-muted text-accent flex items-center justify-center text-sm font-semibold">
            DL
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">Daniel Lopes</p>
            <p className="text-xs text-muted-foreground mt-0.5">daniel.lopes@suno.com.br</p>
          </div>
        </div>
      </div>
    </header>
  );
}
