"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Wrench, Shield } from "lucide-react";

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
      style={{ width: "256px" }}
      className="fixed inset-y-0 left-0 bg-[#111827] flex flex-col z-30"
    >
      <div className="px-6 py-7 border-b border-white/10">
        <img src="/suno-logo.png" alt="Suno" className="h-8 w-auto" />
        <p className="text-[#9CA3AF] text-[10px] mt-3 font-medium tracking-widest uppercase">
          Access Control
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[#D42126] text-white"
                  : "text-[#9CA3AF] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-[#D42126] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            DL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Daniel Lopes</p>
            <p className="text-[#9CA3AF] text-[11px] truncate">Coordenador de TI</p>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#D42126]/20 text-[#F87171]">
            TI
          </span>
        </div>
      </div>
    </aside>
  );
}
