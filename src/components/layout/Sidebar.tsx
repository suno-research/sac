"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Wrench, Shield, AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SunoLogo } from "@/components/layout/SunoLogo";
import { countPendencias, filterAcessosByRole } from "@/lib/acessos-scope";
import { useActiveModule } from "@/lib/use-active-module";
import { secNavItems } from "@/lib/sec-nav";

const sacNavItems = [
  { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários",  icon: Users },
  { href: "/ferramentas",  label: "Ferramentas",   icon: Wrench },
  { href: "/perfis",       label: "Perfis Padrão", icon: Shield },
  { href: "/pendencias",   label: "Pendências",    icon: AlertTriangle },
];

export function Sidebar() {
  const pathname     = usePathname();
  const { data: session } = useSession();
  const activeModule = useActiveModule();

  const userName  = session?.user?.name  ?? session?.user?.email ?? "Usuário";
  const userEmail = session?.user?.email ?? "";
  const role      = session?.user?.role  ?? "user";
  const initials  = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const [pendenciasCount, setPendenciasCount] = useState(0);
  const [profileId, setProfileId]             = useState<string | null>(null);

  const profileHref = userEmail && profileId ? `/funcionarios/${profileId}` : null;
  const isSEC       = activeModule === "sec";

  const sacNav = sacNavItems.filter((item) => {
    if (item.href === "/pendencias") return role === "ti" || role === "gestor";
    return true;
  });

  const secNav = secNavItems.filter((item) => {
    if ("restricted" in item && item.restricted) return role === "ti" || role === "gestor";
    return true;
  });

  const navItems    = isSEC ? secNav : sacNav;
  const moduleLabel = isSEC ? "Equipment Control" : "Access Control";
  const switchHref  = isSEC ? "/dashboard" : "/sec/ativos";
  const switchLabel = isSEC ? "Ir para SAC" : "Ir para SEC";

  useEffect(() => {
    if (isSEC) return;
    if (role !== "ti" && role !== "gestor") return;
    Promise.all([
      fetch("/api/acessos").then((r) => r.json()),
      fetch("/api/funcionarios").then((r) => r.json()),
    ])
      .then(([acessos, funcionarios]) => {
        if (!Array.isArray(acessos) || !Array.isArray(funcionarios)) return;
        const scoped = filterAcessosByRole(acessos, funcionarios, role, userEmail);
        setPendenciasCount(countPendencias(scoped));
      })
      .catch(() => setPendenciasCount(0));
  }, [pathname, role, userEmail, isSEC]);

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    fetch("/api/funcionarios/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((func) => { if (!cancelled) setProfileId(func?.id ?? null); })
      .catch(() => { if (!cancelled) setProfileId(null); });
    return () => { cancelled = true; };
  }, [userEmail]);

  const userBlockClass = cn(
    "flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors",
    profileHref && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  );

  const userBlockContent = (
    <>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{userName}</p>
        <p className="mt-0.5 truncate text-xs text-sidebar-muted">{userEmail}</p>
      </div>
      <span className="rounded-md bg-accent-muted px-2 py-1 text-[10px] font-semibold text-accent uppercase">
        {role}
      </span>
    </>
  );

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-colors duration-150"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="border-b border-sidebar-border px-5 py-6">
        <Link
          href={isSEC ? "/sec/ativos" : "/dashboard"}
          className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <SunoLogo height={44} className="max-w-[200px]" />
        </Link>
        <div className="mt-4 flex items-center justify-between pl-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-muted">
            {moduleLabel}
          </p>
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
            isSEC
              ? "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400"
              : "bg-accent-muted text-accent"
          )}>
            {isSEC ? "SEC" : "SAC"}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active    = pathname === href || pathname.startsWith(href + "/");
          const showBadge = !isSEC && href === "/pendencias" && pendenciasCount > 0;
          return (
            <Link key={href} href={href} className="relative block">
              {active && (
                <motion.div
                  layoutId={isSEC ? "sidebar-active-sec" : "sidebar-active-sac"}
                  className={cn(
                    "absolute inset-0 rounded-xl border-l-[3px]",
                    isSEC
                      ? "border-l-blue-500 bg-blue-500/8 dark:bg-blue-400/8"
                      : "border-l-accent bg-sidebar-active"
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={cn(
                "relative flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors duration-150",
                active
                  ? "text-foreground"
                  : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  active && (isSEC ? "text-blue-500 dark:text-blue-400" : "text-accent")
                )} />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                    {pendenciasCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 pt-3 pb-1">
        <Link
          href={switchHref}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-sidebar-muted transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
          <span>{switchLabel}</span>
        </Link>
      </div>

      <div className="border-t border-sidebar-border px-4 py-4">
        {profileHref ? (
          <Link href={profileHref} className={userBlockClass} aria-label={`Ver perfil de ${userName}`}>
            {userBlockContent}
          </Link>
        ) : (
          <div className={userBlockClass} aria-label={userName}>
            {userBlockContent}
          </div>
        )}
      </div>
    </aside>
  );
}
