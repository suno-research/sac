import { Badge } from "@/components/ui/badge";
import type { StatusAcesso, StatusFuncionario, StatusOffboarding, StatusMovimentacao } from "@/lib/mock-data";

export function StatusAcessoBadge({ status }: { status: StatusAcesso }) {
  const map: Record<StatusAcesso, { label: string; variant: "success" | "warning" | "destructive" | "muted" }> = {
    Ativo: { label: "Ativo", variant: "success" },
    "Pendente concessão": { label: "Pendente concessão", variant: "warning" },
    "Pendente remoção": { label: "Pendente remoção", variant: "destructive" },
    "Sem acesso": { label: "Sem acesso", variant: "muted" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusFuncionarioBadge({ status }: { status: StatusFuncionario }) {
  if (status === "Ativo") return <Badge variant="success">Ativo</Badge>;
  return <Badge variant="muted">Desligado</Badge>;
}

export function StatusOffboardingBadge({ status }: { status: StatusOffboarding }) {
  if (status === "Em andamento") return <Badge variant="warning">Em andamento</Badge>;
  return <Badge variant="success">Concluído</Badge>;
}

export function StatusMovimentacaoBadge({ status }: { status: StatusMovimentacao }) {
  const map: Record<StatusMovimentacao, { label: string; variant: "success" | "warning" | "muted" }> = {
    Concluído: { label: "Concluído", variant: "success" },
    "Em andamento": { label: "Em andamento", variant: "warning" },
    Pendente: { label: "Pendente", variant: "muted" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
