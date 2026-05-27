"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Wrench, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="px-5 py-7 border-b border-sidebar-border">
        <Link href="/dashboard" className="block rounded-xl overflow-hidden ring-1 ring-black/5 shadow-xs transition-opacity hover:opacity-95">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/suno-logo.png"
            alt="Suno"
            className="w-full h-auto max-h-[52px] object-contain object-left bg-black"
          />
        </Link>
        <p className="text-sidebar-muted text-[11px] mt-4 pl-1 font-medium tracking-[0.12em] uppercase">
          Access Control
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="block relative">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-sidebar-active border-l-[3px] border-l-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors duration-150",
                  active
                    ? "text-foreground"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-accent")} />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
          <div className="h-10 w-10 rounded-full bg-accent-muted text-accent flex items-center justify-center text-sm font-semibold flex-shrink-0">
            DL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">Daniel Lopes</p>
            <p className="text-sidebar-muted text-xs truncate mt-0.5">Coordenador de TI</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-accent-muted text-accent">
            TI
          </span>
        </div>
      </div>
    </aside>
  );
}
