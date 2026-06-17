import {
  LayoutDashboard,
  Monitor,
  Package,
  ClipboardList,
  FileText,
  AlertTriangle,
  Settings,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SECNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const secNavItems: SECNavItem[] = [
  { href: "/sec/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sec/ativos", label: "Ativos", icon: Monitor },
  { href: "/sec/estoque", label: "Estoque", icon: Package },
  { href: "/sec/alocacoes", label: "Alocações", icon: ClipboardList },
  { href: "/sec/termos", label: "Termos", icon: FileText },
  { href: "/sec/pendencias", label: "Pendências", icon: AlertTriangle },
  { href: "/sec/auditoria", label: "Auditoria", icon: History },
  { href: "/sec/configuracoes", label: "Configurações", icon: Settings },
];
