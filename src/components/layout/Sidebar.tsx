"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Wrench, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SunoLogo } from "@/components/layout/SunoLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/perfis", label: "Perfis Padrão", icon: Shield },
  { href: "/pendencias", label: "Pendências", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuário";
  const userEmail = session?.user?.email ?? "";
  const role = session?.user?.role ?? "user";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const [pendenciasCount, setPendenciasCount] = useState(0);

  const navItemsFiltrados = navItems.filter((item) => {
    if (item.href === "/pendencias") return role === "ti" || role === "gestor";
    return true;
  });

  useEffect(() => {
    fetch("/api/acessos")
      .then((r) => r.json())
      .then((acessos) => {
        if (!Array.isArray(acessos)) return;
        const count = acessos.filter(
          (a: { status: string }) =>
            a.status === "Pendente concessão" || a.status === "Pendente remoção"
        ).length;
        setPendenciasCount(count);
      })
      .catch(() => setPendenciasCount(0));
  }, [pathname]);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-colors duration-150"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="border-b border-sidebar-border px-5 py-6">
        <Link
          href="/dashboard"
          className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <SunoLogo height={44} className="max-w-[200px]" />
        </Link>
        <p className="mt-4 pl-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-muted">
          Access Control
        </p>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItemsFiltrados.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border-l-[3px] border-l-accent bg-sidebar-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors duration-150",
                  active
                    ? "text-foreground"
                    : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-accent")} />
                <span className="flex-1">{label}</span>
                {href === "/pendencias" && pendenciasCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                    {pendenciasCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-6">
        <div className="flex cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/50">
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
        </div>
      </div>
    </aside>
  );
}
