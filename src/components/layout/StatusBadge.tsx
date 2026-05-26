import { Badge } from "@/components/ui/badge";
import type { StatusAcesso, StatusFuncionario, StatusOffboarding, StatusMovimentacao } from "@/lib/mock-data";

export function StatusAcessoBadge({ status }: { status: StatusAcesso }) {
  const map: Record<StatusAcesso, { label: string; className: string }> = {
    "Ativo": { label: "Ativo", className: "bg-green-100 text-green-800 border-transparent" },
    "Pendente concessão": { label: "Pendente concessão", className: "bg-yellow-100 text-yellow-800 border-transparent" },
    "Pendente remoção": { label: "Pendente remoção", className: "bg-red-100 text-red-800 border-transparent" },
    "Sem acesso": { label: "Sem acesso", className: "bg-gray-100 text-gray-500 border-transparent" },
  };
  const cfg = map[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function StatusFuncionarioBadge({ status }: { status: StatusFuncionario }) {
  if (status === "Ativo") return <Badge className="bg-green-100 text-green-800 border-transparent">Ativo</Badge>;
  return <Badge className="bg-gray-100 text-gray-500 border-transparent">Desligado</Badge>;
}

export function StatusOffboardingBadge({ status }: { status: StatusOffboarding }) {
  if (status === "Em andamento") return <Badge className="bg-yellow-100 text-yellow-800 border-transparent">Em andamento</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-transparent">Concluído</Badge>;
}

export function StatusMovimentacaoBadge({ status }: { status: StatusMovimentacao }) {
  const map: Record<StatusMovimentacao, { label: string; className: string }> = {
    "Concluído": { label: "Concluído", className: "bg-green-100 text-green-800 border-transparent" },
    "Em andamento": { label: "Em andamento", className: "bg-yellow-100 text-yellow-800 border-transparent" },
    "Pendente": { label: "Pendente", className: "bg-gray-100 text-gray-500 border-transparent" },
  };
  const cfg = map[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
