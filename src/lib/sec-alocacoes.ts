import type { Alocacao, StatusAlocacao } from "@/types/sec";

const STATUS_VALIDOS: StatusAlocacao[] = [
  "ativa",
  "devolvida",
  "pendente",
  "cancelada",
];

function parseStatus(value: string): StatusAlocacao {
  return STATUS_VALIDOS.includes(value as StatusAlocacao)
    ? (value as StatusAlocacao)
    : "pendente";
}

export function generateAlocacaoId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ALO-${y}${m}${d}-${suffix}`;
}

export function rowToAlocacao(row: string[]): Alocacao {
  const alocacao: Alocacao = {
    alocacao_id: row[0] || "",
    equipamento_id: row[1] || "",
    funcionario_id: row[2] || "",
    funcionario_email: row[3] || "",
    funcionario_nome: row[4] || "",
    status: parseStatus(row[5] || "pendente"),
    data_alocacao: row[6] || "",
    created_at: row[12] || "",
    created_by: row[13] || "",
    updated_at: row[14] || "",
    updated_by: row[15] || "",
  };

  if (row[7]) alocacao.data_devolucao_prevista = row[7];
  if (row[8]) alocacao.data_devolucao_real = row[8];
  if (row[9]) alocacao.termo_id = row[9];
  if (row[10]) alocacao.motivo_devolucao = row[10];
  if (row[11]) alocacao.observacoes = row[11];
  if (row[16]) alocacao.deleted_at = row[16];
  if (row[17]) alocacao.deleted_by = row[17];

  return alocacao;
}

export function alocacaoToRow(a: Alocacao): string[] {
  return [
    a.alocacao_id,
    a.equipamento_id,
    a.funcionario_id,
    a.funcionario_email,
    a.funcionario_nome,
    a.status,
    a.data_alocacao,
    a.data_devolucao_prevista ?? "",
    a.data_devolucao_real ?? "",
    a.termo_id ?? "",
    a.motivo_devolucao ?? "",
    a.observacoes ?? "",
    a.created_at,
    a.created_by,
    a.updated_at,
    a.updated_by,
    a.deleted_at ?? "",
    a.deleted_by ?? "",
  ];
}

export function statusAlocacaoLabel(status: StatusAlocacao): string {
  const labels: Record<StatusAlocacao, string> = {
    ativa: "Ativa",
    devolvida: "Devolvida",
    pendente: "Pendente",
    cancelada: "Cancelada",
  };
  return labels[status] ?? status;
}

export function statusAlocacaoVariant(
  status: StatusAlocacao
): "default" | "success" | "warning" | "destructive" {
  const variants: Record<
    StatusAlocacao,
    "default" | "success" | "warning" | "destructive"
  > = {
    ativa: "success",
    devolvida: "default",
    pendente: "warning",
    cancelada: "destructive",
  };
  return variants[status];
}

export function alocacoesAtivasDoEquipamento(
  alocacoes: Alocacao[],
  equipamentoId: string
): Alocacao[] {
  return alocacoes.filter(
    (a) =>
      a.equipamento_id === equipamentoId &&
      a.status === "ativa" &&
      !a.deleted_at
  );
}

export const TODOS_STATUS_ALOCACAO: StatusAlocacao[] = [...STATUS_VALIDOS];
