import type { StatusTermo, Termo } from "@/types/sec";

const STATUS_VALIDOS: StatusTermo[] = ["pendente", "assinado", "cancelado"];

function parseStatus(value: string): StatusTermo {
  return STATUS_VALIDOS.includes(value as StatusTermo)
    ? (value as StatusTermo)
    : "pendente";
}

export function generateTermoId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRM-${y}${m}${d}-${suffix}`;
}

export function rowToTermo(row: string[]): Termo {
  const termo: Termo = {
    termo_id: row[0] || "",
    alocacao_id: row[1] || "",
    equipamento_id: row[2] || "",
    funcionario_id: row[3] || "",
    funcionario_nome: row[4] || "",
    funcionario_email: row[5] || "",
    status: parseStatus(row[6] || "pendente"),
    data_emissao: row[7] || "",
    created_at: row[13] || "",
    created_by: row[14] || "",
    updated_at: row[15] || "",
    updated_by: row[16] || "",
  };

  if (row[8]) termo.data_assinatura = row[8];
  if (row[9]) termo.assinado_por = row[9];
  if (row[10]) termo.canal_assinatura = row[10];
  if (row[11]) termo.documento_url = row[11];
  if (row[12]) termo.observacoes = row[12];
  if (row[17]) termo.deleted_at = row[17];
  if (row[18]) termo.deleted_by = row[18];

  return termo;
}

export function termoToRow(t: Termo): string[] {
  return [
    t.termo_id,
    t.alocacao_id,
    t.equipamento_id,
    t.funcionario_id,
    t.funcionario_nome,
    t.funcionario_email,
    t.status,
    t.data_emissao,
    t.data_assinatura ?? "",
    t.assinado_por ?? "",
    t.canal_assinatura ?? "",
    t.documento_url ?? "",
    t.observacoes ?? "",
    t.created_at,
    t.created_by,
    t.updated_at,
    t.updated_by,
    t.deleted_at ?? "",
    t.deleted_by ?? "",
  ];
}

export function statusTermoLabel(status: StatusTermo): string {
  const labels: Record<StatusTermo, string> = {
    pendente: "Pendente",
    assinado: "Assinado",
    cancelado: "Cancelado",
  };
  return labels[status] ?? status;
}

export function statusTermoVariant(
  status: StatusTermo
): "warning" | "success" | "destructive" {
  const variants: Record<StatusTermo, "warning" | "success" | "destructive"> = {
    pendente: "warning",
    assinado: "success",
    cancelado: "destructive",
  };
  return variants[status];
}

export const TODOS_STATUS_TERMO: StatusTermo[] = [...STATUS_VALIDOS];
