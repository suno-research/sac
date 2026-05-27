"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Wrench, Shield } from "lucide-react";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários", icon: Users           },
  { href: "/ferramentas",  label: "Ferramentas",  icon: Wrench          },
  { href: "/perfis",       label: "Perfis Padrão",icon: Shield          },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#0f172a] fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex flex-col px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D42126]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SAC</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400 leading-tight">Suno Access Control</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#D42126] text-white"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[10px] text-slate-500">v1.0.0 · Suno Research</p>
      </div>
    </aside>
  );
}
