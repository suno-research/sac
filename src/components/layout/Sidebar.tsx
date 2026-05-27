"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Wrench, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { SunoLogo } from "@/components/layout/SunoLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/perfis", label: "Perfis Padrão", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

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
        {navItems.map(({ href, label, icon: Icon }) => {
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
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-6">
        <div className="flex cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/50">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent">
            DL
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">Daniel Lopes</p>
            <p className="mt-0.5 truncate text-xs text-sidebar-muted">Coordenador de TI</p>
          </div>
          <span className="rounded-md bg-accent-muted px-2 py-1 text-[10px] font-semibold text-accent">
            TI
          </span>
        </div>
      </div>
    </aside>
  );
}
