import type {
  Alocacao,
  Ativo,
  ItemEstoque,
  Patrimonio,
  Pendencia,
  TipoPendencia,
} from "@/types/sec";
import { alocacoesAtivasDoEquipamento } from "@/lib/sec-alocacoes";

function isDatePast(isoDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function buildPendencia(
  tipo: TipoPendencia,
  entidade: string,
  entidadeId: string,
  titulo: string,
  descricao?: string
): Pendencia {
  const now = new Date().toISOString();
  return {
    pendencia_id: `PND-${tipo}-${entidadeId}`,
    tipo,
    status: "aberta",
    entidade,
    entidade_id: entidadeId,
    titulo,
    descricao,
    created_at: now,
    updated_at: now,
  };
}

export function gerarPendencias(params: {
  ativos: Ativo[];
  alocacoes: Alocacao[];
  patrimonios: Patrimonio[];
  estoques: ItemEstoque[];
}): Pendencia[] {
  const { ativos, alocacoes, patrimonios, estoques } = params;
  const pendencias: Pendencia[] = [];

  const ativosAtivos = ativos.filter(
    (a) => a.status === "ativo" && !a.deleted_at && a.equipamento_id.trim() !== ""
  );

  const alocacoesVisiveis = alocacoes.filter((a) => !a.deleted_at);

  const equipamentosComPatrimonioAtivo = new Set(
    patrimonios
      .filter((p) => p.status === "ativo" && p.equipamento_id.trim() !== "")
      .map((p) => p.equipamento_id)
  );

  for (const ativo of ativosAtivos) {
    const ativas = alocacoesAtivasDoEquipamento(alocacoesVisiveis, ativo.equipamento_id);
    if (ativas.length === 0) {
      pendencias.push(
        buildPendencia(
          "equipamento_sem_responsavel",
          "EQUIPAMENTOS",
          ativo.equipamento_id,
          `${ativo.nome} sem responsável`,
          `O equipamento ${ativo.nome} (${ativo.equipamento_id}) está ativo e não possui alocação ativa.`
        )
      );
    }

    if (!equipamentosComPatrimonioAtivo.has(ativo.equipamento_id)) {
      pendencias.push(
        buildPendencia(
          "patrimonio_sem_tombamento",
          "EQUIPAMENTOS",
          ativo.equipamento_id,
          `${ativo.nome} sem tombamento`,
          `O equipamento ${ativo.nome} (${ativo.equipamento_id}) não possui registro de patrimônio ativo.`
        )
      );
    }
  }

  for (const alocacao of alocacoesVisiveis) {
    if (
      alocacao.status === "ativa" &&
      alocacao.data_devolucao_prevista &&
      isDatePast(alocacao.data_devolucao_prevista)
    ) {
      pendencias.push(
        buildPendencia(
          "devolucao_atrasada",
          "ALOCACOES",
          alocacao.alocacao_id,
          `Devolução atrasada — ${alocacao.funcionario_nome}`,
          `A alocação ${alocacao.alocacao_id} do equipamento ${alocacao.equipamento_id} para ${alocacao.funcionario_nome} deveria ter sido devolvida em ${alocacao.data_devolucao_prevista}.`
        )
      );
    }
  }

  for (const item of estoques) {
    if (
      item.estoque_minimo !== undefined &&
      item.quantidade_disponivel < item.estoque_minimo
    ) {
      pendencias.push(
        buildPendencia(
          "estoque_abaixo_minimo",
          "ESTOQUE",
          item.estoque_id,
          `${item.descricao} abaixo do mínimo`,
          `Disponível: ${item.quantidade_disponivel} | Mínimo: ${item.estoque_minimo} (${item.estoque_id}).`
        )
      );
    }
  }

  return pendencias;
}

const TIPOS_PENDENCIA: TipoPendencia[] = [
  "equipamento_sem_responsavel",
  "devolucao_atrasada",
  "patrimonio_sem_tombamento",
  "estoque_abaixo_minimo",
];

export function tipoPendenciaLabel(tipo: TipoPendencia): string {
  const labels: Record<TipoPendencia, string> = {
    equipamento_sem_responsavel: "Sem responsável",
    devolucao_atrasada: "Devolução atrasada",
    patrimonio_sem_tombamento: "Sem tombamento",
    estoque_abaixo_minimo: "Estoque baixo",
  };
  return labels[tipo] ?? tipo;
}

export function tipoPendenciaCardLabel(tipo: TipoPendencia): string {
  const labels: Record<TipoPendencia, string> = {
    equipamento_sem_responsavel: "Equipamentos sem responsável",
    devolucao_atrasada: "Devoluções atrasadas",
    patrimonio_sem_tombamento: "Sem tombamento patrimonial",
    estoque_abaixo_minimo: "Estoque abaixo do mínimo",
  };
  return labels[tipo] ?? tipo;
}

export function pendenciaRegistroHref(
  entidade: string,
  entidadeId: string
): string | null {
  switch (entidade) {
    case "EQUIPAMENTOS":
      return `/sec/ativos/${entidadeId}`;
    case "ESTOQUE":
      return `/sec/estoque/${entidadeId}`;
    case "PATRIMONIO":
      return `/sec/patrimonio/${entidadeId}`;
    case "ALOCACOES":
      return null;
    default:
      return null;
  }
}

export const TODOS_TIPOS_PENDENCIA: TipoPendencia[] = [...TIPOS_PENDENCIA];
