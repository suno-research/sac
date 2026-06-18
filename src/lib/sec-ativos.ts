import type {
  Ativo,
  StatusEquipamento,
  TipoEquipamento,
} from "@/types/sec";

const TIPOS_VALIDOS: TipoEquipamento[] = [
  "notebook",
  "desktop",
  "monitor",
  "periferico",
  "telefone",
  "tablet",
  "servidor",
  "outro",
];

const STATUS_VALIDOS: StatusEquipamento[] = [
  "ativo",
  "inativo",
  "em_manutencao",
  "descartado",
];

function parseTipo(value: string): TipoEquipamento {
  return TIPOS_VALIDOS.includes(value as TipoEquipamento)
    ? (value as TipoEquipamento)
    : "outro";
}

function parseStatus(value: string): StatusEquipamento {
  return STATUS_VALIDOS.includes(value as StatusEquipamento)
    ? (value as StatusEquipamento)
    : "ativo";
}

export function generateAtivoId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EQP-${y}${m}${d}-${suffix}`;
}

export function rowToAtivo(row: string[]): Ativo {
  const ativo: Ativo = {
    equipamento_id: row[0] || "",
    nome: row[1] || "",
    tipo: parseTipo(row[2] || ""),
    marca: row[3] || "",
    modelo: row[4] || "",
    status: parseStatus(row[8] || "ativo"),
    created_at: row[16] || "",
    created_by: row[17] || "",
    updated_at: row[18] || "",
    updated_by: row[19] || "",
  };

  if (row[5]) ativo.numero_serie = row[5];
  if (row[6]) ativo.numero_patrimonio = row[6];
  if (row[7]) ativo.empresa_proprietaria = row[7];
  if (row[9]) ativo.localizacao_atual = row[9];
  if (row[10]) ativo.data_aquisicao = row[10];
  if (row[11]) ativo.valor_aquisicao = row[11];
  if (row[12]) ativo.fornecedor = row[12];
  if (row[13]) ativo.nota_fiscal = row[13];
  if (row[14]) ativo.garantia_ate = row[14];
  if (row[15]) ativo.observacoes = row[15];
  if (row[20]) ativo.deleted_at = row[20];
  if (row[21]) ativo.deleted_by = row[21];

  return ativo;
}

export function ativoToRow(ativo: Ativo): string[] {
  return [
    ativo.equipamento_id,
    ativo.nome,
    ativo.tipo,
    ativo.marca,
    ativo.modelo,
    ativo.numero_serie ?? "",
    ativo.numero_patrimonio ?? "",
    ativo.empresa_proprietaria ?? "",
    ativo.status,
    ativo.localizacao_atual ?? "",
    ativo.data_aquisicao ?? "",
    ativo.valor_aquisicao ?? "",
    ativo.fornecedor ?? "",
    ativo.nota_fiscal ?? "",
    ativo.garantia_ate ?? "",
    ativo.observacoes ?? "",
    ativo.created_at,
    ativo.created_by,
    ativo.updated_at,
    ativo.updated_by,
    ativo.deleted_at ?? "",
    ativo.deleted_by ?? "",
  ];
}

export function tipoLabel(tipo: TipoEquipamento): string {
  const labels: Record<TipoEquipamento, string> = {
    notebook: "Notebook",
    desktop: "Desktop",
    monitor: "Monitor",
    periferico: "Periférico",
    telefone: "Telefone",
    tablet: "Tablet",
    servidor: "Servidor",
    outro: "Outro",
  };
  return labels[tipo] ?? tipo;
}

export function statusLabel(status: StatusEquipamento): string {
  const labels: Record<StatusEquipamento, string> = {
    ativo: "Ativo",
    inativo: "Inativo",
    em_manutencao: "Em manutenção",
    descartado: "Descartado",
  };
  return labels[status] ?? status;
}

export function statusVariant(
  status: StatusEquipamento
): "success" | "warning" | "destructive" | "muted" {
  const variants: Record<
    StatusEquipamento,
    "success" | "warning" | "destructive" | "muted"
  > = {
    ativo: "success",
    em_manutencao: "warning",
    inativo: "muted",
    descartado: "destructive",
  };
  return variants[status];
}

export const TODOS_TIPOS: TipoEquipamento[] = [...TIPOS_VALIDOS];

export const TODOS_STATUS: StatusEquipamento[] = [...STATUS_VALIDOS];
