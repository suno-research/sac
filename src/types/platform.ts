export type PlatformModule = "sac" | "sec";

export interface ModuleDefinition {
  id: PlatformModule;
  name: string;
  fullName: string;
  description: string;
  href: string;
  status: "active" | "beta" | "coming_soon";
}

export const MODULES: ModuleDefinition[] = [
  {
    id: "sac",
    name: "SAC",
    fullName: "Access Control",
    description: "Gestão de acessos, ferramentas, perfis e onboarding/offboarding de colaboradores.",
    href: "/dashboard",
    status: "active",
  },
  {
    id: "sec",
    name: "SEC",
    fullName: "Equipment Control",
    description: "Gestão de ativos, equipamentos, estoque, termos de responsabilidade e patrimônio.",
    href: "/sec/ativos",
    status: "beta",
  },
];
