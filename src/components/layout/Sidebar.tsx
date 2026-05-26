"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Wrench, Shield, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/perfis", label: "Perfis Padrão", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#DDDDDD] bg-white fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex flex-col px-6 py-6 border-b border-[#DDDDDD]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D42126]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">SAC</span>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-gray-400 leading-tight">Suno Access Control</p>
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
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors group",
                active
                  ? "bg-[#D42126]/10 text-[#D42126]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#D42126]" : "text-gray-400 group-hover:text-gray-600")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 text-[#D42126]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#DDDDDD]">
        <p className="text-[10px] text-gray-400">v1.0.0 · Suno Research</p>
      </div>
    </aside>
  );
}
