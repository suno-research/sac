import type { FuncionarioScope } from "./acessos-scope";

export function filterFuncionariosByRole<T extends FuncionarioScope>(
  funcionarios: T[],
  role: string,
  userEmail: string
): T[] {
  if (role === "ti") return funcionarios;

  if (role === "gestor") {
    const gestor = funcionarios.find((f) => f.email === userEmail);
    if (!gestor) return [];
    return funcionarios.filter((f) => f.gestorId === gestor.id);
  }

  const self = funcionarios.find((f) => f.email === userEmail);
  if (!self) return [];
  return [self];
}

export function filterByFuncionarioScope<T extends { funcionarioId: string }>(
  items: T[],
  funcionarios: FuncionarioScope[],
  role: string,
  userEmail: string
): T[] {
  const allowedIds = new Set(
    filterFuncionariosByRole(funcionarios, role, userEmail).map((f) => f.id)
  );
  return items.filter((item) => allowedIds.has(item.funcionarioId));
}

export function formatOrigemAcesso(concedidoPor: string | undefined): string {
  if (!concedidoPor) return "—";
  const lower = concedidoPor.toLowerCase();
  if (lower.includes("passbolt")) return "Passbolt";
  if (lower.includes("monday") || lower.includes("automation")) return "Automação";
  return concedidoPor;
}

export function daysSinceDate(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

const MOV_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  "em andamento": "Em andamento",
  concluido: "Concluído",
  concluído: "Concluído",
  cancelado: "Cancelado",
};

export function normalizeMovimentacaoStatus(status: string): string {
  const key = status.trim().toLowerCase();
  return MOV_STATUS_LABELS[key] || status;
}

export function movimentacaoStatusVariant(
  status: string
): "success" | "warning" | "muted" {
  const normalized = normalizeMovimentacaoStatus(status);
  if (normalized === "Concluído") return "success";
  if (normalized === "Em andamento") return "warning";
  return "muted";
}
