"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
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

  const nome = session?.user?.name || "Usuário";
  const email = session?.user?.email || "";
  const foto = session?.user?.image;
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = session?.user?.role || "gestor";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 flex items-center justify-between",
        "h-[var(--header-height)] px-6 sm:px-8",
        "border-b border-header-border bg-header/95 backdrop-blur-md",
        "transition-colors duration-150"
      )}
      style={{ left: "var(--sidebar-width)" }}
    >
      <div />
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground"
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          type="button"
          className="relative rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground"
          aria-label="Notificações"
        >
          <Bell size={20} />
          {pendencias > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </button>

        <div className="flex items-center gap-3 border-l border-header-border pl-4">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt={nome}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-header-border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="m-0 text-[13px] font-semibold leading-tight text-header-foreground">
              {nome}
            </p>
            <p className="m-0 text-[11px] leading-tight text-header-muted">{email}</p>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold",
              role === "ti"
                ? "bg-accent-muted text-accent"
                : "bg-muted text-muted-foreground dark:bg-blue-500/15 dark:text-blue-300"
            )}
          >
            {role === "ti" ? "TI" : "Gestor"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
