import type { Patrimonio, StatusPatrimonio } from "@/types/sec";

const STATUS_VALIDOS: StatusPatrimonio[] = ["ativo", "em_analise", "baixado"];

function parseStatus(value: string): StatusPatrimonio {
  return STATUS_VALIDOS.includes(value as StatusPatrimonio)
    ? (value as StatusPatrimonio)
    : "ativo";
}

export function generatePatrimonioId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PAT-${y}${m}${d}-${suffix}`;
}

export function rowToPatrimonio(row: string[]): Patrimonio {
  const patrimonio: Patrimonio = {
    patrimonio_id: row[0] || "",
    equipamento_id: row[1] || "",
    numero_patrimonio: row[2] || "",
    status: parseStatus(row[3] || "ativo"),
    data_tombamento: row[4] || "",
    responsavel_tombamento: row[7] || "",
    created_at: row[12] || "",
    created_by: row[13] || "",
    updated_at: row[14] || "",
    updated_by: row[15] || "",
  };

  if (row[5]) patrimonio.data_baixa = row[5];
  if (row[6]) patrimonio.motivo_baixa = row[6];
  if (row[8]) patrimonio.documento_referencia = row[8];
  if (row[9]) patrimonio.valor_tombamento = row[9];
  if (row[10]) patrimonio.depreciacao_anual_pct = row[10];
  if (row[11]) patrimonio.observacoes = row[11];

  return patrimonio;
}

export function patrimonioToRow(patrimonio: Patrimonio): string[] {
  return [
    patrimonio.patrimonio_id,
    patrimonio.equipamento_id,
    patrimonio.numero_patrimonio,
    patrimonio.status,
    patrimonio.data_tombamento,
    patrimonio.data_baixa ?? "",
    patrimonio.motivo_baixa ?? "",
    patrimonio.responsavel_tombamento,
    patrimonio.documento_referencia ?? "",
    patrimonio.valor_tombamento ?? "",
    patrimonio.depreciacao_anual_pct ?? "",
    patrimonio.observacoes ?? "",
    patrimonio.created_at,
    patrimonio.created_by,
    patrimonio.updated_at,
    patrimonio.updated_by,
  ];
}

export function statusPatrimonioLabel(status: StatusPatrimonio): string {
  const labels: Record<StatusPatrimonio, string> = {
    ativo: "Ativo",
    em_analise: "Em análise",
    baixado: "Baixado",
  };
  return labels[status] ?? status;
}

export function statusPatrimonioVariant(
  status: StatusPatrimonio
): "success" | "warning" | "muted" {
  const variants: Record<StatusPatrimonio, "success" | "warning" | "muted"> = {
    ativo: "success",
    em_analise: "warning",
    baixado: "muted",
  };
  return variants[status];
}

export const TODOS_STATUS_PATRIMONIO: StatusPatrimonio[] = [...STATUS_VALIDOS];
