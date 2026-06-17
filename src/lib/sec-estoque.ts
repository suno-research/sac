import type { ItemEstoque, UnidadeEstoque } from "@/types/sec";

const UNIDADES_VALIDAS: UnidadeEstoque[] = ["unidade", "par", "kit", "caixa"];

function parseUnidade(value: string): UnidadeEstoque {
  return UNIDADES_VALIDAS.includes(value as UnidadeEstoque)
    ? (value as UnidadeEstoque)
    : "unidade";
}

export function generateEstoqueId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EST-${y}${m}${d}-${suffix}`;
}

export function rowToItemEstoque(row: string[]): ItemEstoque {
  const item: ItemEstoque = {
    estoque_id: row[0] || "",
    equipamento_id: row[1] || "",
    descricao: row[2] || "",
    quantidade_total: parseInt(row[3] || "0", 10),
    quantidade_disponivel: parseInt(row[4] || "0", 10),
    quantidade_alocada: parseInt(row[5] || "0", 10),
    unidade: parseUnidade(row[6] || "unidade"),
    created_at: row[10] || "",
    created_by: row[11] || "",
    updated_at: row[12] || "",
    updated_by: row[13] || "",
  };

  if (row[7]) item.localizacao = row[7];
  if (row[8]) item.estoque_minimo = parseInt(row[8], 10);
  if (row[9]) item.observacoes = row[9];

  return item;
}

export function itemEstoqueToRow(item: ItemEstoque): string[] {
  return [
    item.estoque_id,
    item.equipamento_id,
    item.descricao,
    String(item.quantidade_total),
    String(item.quantidade_disponivel),
    String(item.quantidade_alocada),
    item.unidade,
    item.localizacao ?? "",
    item.estoque_minimo !== undefined ? String(item.estoque_minimo) : "",
    item.observacoes ?? "",
    item.created_at,
    item.created_by,
    item.updated_at,
    item.updated_by,
  ];
}

export function unidadeLabel(unidade: UnidadeEstoque): string {
  const labels: Record<UnidadeEstoque, string> = {
    unidade: "Unidade",
    par: "Par",
    kit: "Kit",
    caixa: "Caixa",
  };
  return labels[unidade] ?? unidade;
}

export function isEstoqueCritico(item: ItemEstoque): boolean {
  if (item.quantidade_disponivel === 0) return true;
  if (
    item.estoque_minimo !== undefined &&
    item.quantidade_disponivel <= item.estoque_minimo
  ) {
    return true;
  }
  return false;
}

export const TODAS_UNIDADES: UnidadeEstoque[] = [...UNIDADES_VALIDAS];
