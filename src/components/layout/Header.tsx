"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Bell, LogOut, Moon, Sun, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { countPendencias, filterAcessosByRole } from "@/lib/acessos-scope";

interface Acesso {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: string;
}

interface Funcionario {
  id: string;
  nome: string;
  area: string;
}

interface Ferramenta {
  id: string;
  nome: string;
}

interface PendenciaResumo {
  acesso: Acesso;
  funcionario: Funcionario | undefined;
  ferramenta: Ferramenta | undefined;
}

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [pendencias, setPendencias] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendentesConcessao, setPendentesConcessao] = useState<PendenciaResumo[]>([]);
  const [pendentesRemocao, setPendentesRemocao] = useState<PendenciaResumo[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nome = session?.user?.name || "Usuário";
  const email = session?.user?.email || "";
  const foto = session?.user?.image;
  const initials = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const role = session?.user?.role || "user";
  const mostrarSino = role === "ti" || role === "gestor";

  useEffect(() => {
    if (!mostrarSino) return;
    Promise.all([
      fetch("/api/acessos").then((r) => r.json()),
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
    ])
      .then(([acessos, funcionarios, ferramentas]) => {
        if (!Array.isArray(acessos) || !Array.isArray(funcionarios)) return;
        const scoped = filterAcessosByRole(acessos, funcionarios, role, email);
        const getFuncionario = (id: string) => funcionarios.find((f: Funcionario) => f.id === id);
        const getFerramenta = (id: string) => ferramentas.find((f: Ferramenta) => f.id === id);

        const concessao = scoped
          .filter((a: Acesso) => a.status === "Pendente concessão")
          .slice(0, 5)
          .map((a: Acesso) => ({ acesso: a, funcionario: getFuncionario(a.funcionarioId), ferramenta: getFerramenta(a.ferramentaId) }));

        const remocao = scoped
          .filter((a: Acesso) => a.status === "Pendente remoção")
          .slice(0, 5)
          .map((a: Acesso) => ({ acesso: a, funcionario: getFuncionario(a.funcionarioId), ferramenta: getFerramenta(a.ferramentaId) }));

        setPendentesConcessao(concessao);
        setPendentesRemocao(remocao);
        setPendencias(countPendencias(scoped));
      })
      .catch(() => setPendencias(0));
  }, [mostrarSino, role, email]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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
          className="rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {mostrarSino && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="relative rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Notificações"
              aria-expanded={dropdownOpen}
            >
              <Bell size={20} />
              {pendencias > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">Notificações</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pendencias} pendência{pendencias !== 1 ? "s" : ""} aguardando</p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {pendentesConcessao.length > 0 && (
                    <div>
                      <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning-muted/40">
                        Pendente concessão — {pendentesConcessao.length}
                      </p>
                      {pendentesConcessao.map(({ acesso, funcionario, ferramenta }) => (
                        <Link
                          key={acesso.id}
                          href={`/funcionarios/${acesso.funcionarioId}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                            {funcionario?.nome?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{funcionario?.nome ?? "—"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{ferramenta?.nome ?? "—"} · {funcionario?.area ?? "—"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {pendentesRemocao.length > 0 && (
                    <div>
                      <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive-muted/40">
                        Pendente remoção — {pendentesRemocao.length}
                      </p>
                      {pendentesRemocao.map(({ acesso, funcionario, ferramenta }) => (
                        <Link
                          key={acesso.id}
                          href={`/funcionarios/${acesso.funcionarioId}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-semibold text-destructive">
                            {funcionario?.nome?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{funcionario?.nome ?? "—"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{ferramenta?.nome ?? "—"} · {funcionario?.area ?? "—"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {pendencias === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Nenhuma pendência no momento ✅
                    </div>
                  )}
                </div>

                <Link
                  href="/pendencias"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-between px-5 py-3.5 border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-medium text-foreground">Ver todas as pendências</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 border-l border-header-border pl-4">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={nome} className="h-8 w-8 rounded-full object-cover ring-1 ring-header-border" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="m-0 text-[13px] font-semibold leading-tight text-header-foreground">{nome}</p>
            <p className="m-0 text-[11px] leading-tight text-header-muted">{email}</p>
          </div>
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold",
            role === "ti" ? "bg-accent-muted text-accent" : "bg-muted text-muted-foreground dark:bg-blue-500/15 dark:text-blue-300"
          )}>
            {role === "ti" ? "TI" : role === "gestor" ? "Gestor" : "User"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-xl p-2 text-header-muted transition-colors hover:bg-muted/60 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          title="Sair"
          aria-label="Sair da conta"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
