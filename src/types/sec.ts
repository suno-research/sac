export type TipoEquipamento =
  | "notebook"
  | "desktop"
  | "monitor"
  | "periferico"
  | "telefone"
  | "tablet"
  | "servidor"
  | "outro";

export type StatusEquipamento =
  | "ativo"
  | "inativo"
  | "em_manutencao"
  | "descartado";

export interface Ativo {
  equipamento_id: string;
  nome: string;
  tipo: TipoEquipamento;
  marca: string;
  modelo: string;
  numero_serie?: string;
  numero_patrimonio?: string;
  /** Empresa proprietária: Suno, Plugify, Asset, Pessoal */
  empresa_proprietaria?: string;
  status: StatusEquipamento;
  localizacao_atual?: string;
  data_aquisicao?: string;
  valor_aquisicao?: string;
  fornecedor?: string;
  nota_fiscal?: string;
  garantia_ate?: string;
  observacoes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_at?: string;
  deleted_by?: string;
}

export type CreateAtivoPayload = Omit<
  Ativo,
  | "equipamento_id"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "deleted_at"
  | "deleted_by"
>;

export type UpdateAtivoPayload = Partial<CreateAtivoPayload> & {
  status: StatusEquipamento;
};

export type StatusPatrimonio = "ativo" | "em_analise" | "baixado";

export interface Patrimonio {
  patrimonio_id: string;
  equipamento_id: string;
  numero_patrimonio: string;
  status: StatusPatrimonio;
  data_tombamento: string;
  data_baixa?: string;
  motivo_baixa?: string;
  responsavel_tombamento: string;
  documento_referencia?: string;
  valor_tombamento?: string;
  depreciacao_anual_pct?: string;
  observacoes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export type CreatePatrimonioPayload = Omit<
  Patrimonio,
  "patrimonio_id" | "created_at" | "created_by" | "updated_at" | "updated_by"
>;

export type UpdatePatrimonioPayload = Partial<CreatePatrimonioPayload> & {
  status: StatusPatrimonio;
};

export type UnidadeEstoque = "unidade" | "par" | "kit" | "caixa";

export interface ItemEstoque {
  estoque_id: string;
  equipamento_id: string;
  descricao: string;
  quantidade_total: number;
  quantidade_disponivel: number;
  quantidade_alocada: number;
  unidade: UnidadeEstoque;
  localizacao?: string;
  estoque_minimo?: number;
  observacoes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export type CreateEstoquePayload = Omit<
  ItemEstoque,
  | "estoque_id"
  | "quantidade_alocada"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
>;

export type UpdateEstoquePayload = {
  descricao?: string;
  quantidade_total?: number;
  quantidade_disponivel?: number;
  unidade?: UnidadeEstoque;
  localizacao?: string;
  estoque_minimo?: number;
  observacoes?: string;
};

// ─── ALOCAÇÕES ──────────────────────────────────────────────────────────────

export type StatusAlocacao =
  | "ativa"        // equipamento está com o funcionário
  | "devolvida"    // devolução registrada com sucesso
  | "pendente"     // alocação aguardando confirmação (ex: termo não assinado)
  | "cancelada";   // alocação cancelada antes da entrega

export interface Alocacao {
  alocacao_id: string;
  equipamento_id: string;
  funcionario_id: string;        // referência ao SAC (nunca duplicar dados do funcionário)
  funcionario_email: string;     // snapshot no momento da alocação para histórico
  funcionario_nome: string;      // snapshot no momento da alocação para histórico
  status: StatusAlocacao;
  data_alocacao: string;         // ISO date
  data_devolucao_prevista?: string;
  data_devolucao_real?: string;
  termo_id?: string;             // FK para TERMOS (fase futura); opcional no MVP
  motivo_devolucao?: string;
  observacoes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_at?: string;
  deleted_by?: string;
}

export type CreateAlocacaoPayload = Omit<
  Alocacao,
  | "alocacao_id"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "deleted_at"
  | "deleted_by"
>;

export type UpdateAlocacaoPayload = Partial<CreateAlocacaoPayload> & {
  status: StatusAlocacao;
};

// ─── PENDÊNCIAS ──────────────────────────────────────────────────────────────

export type TipoPendencia =
  | "equipamento_sem_responsavel"  // ativo ativo sem alocação ativa
  | "devolucao_atrasada"           // data_devolucao_prevista ultrapassada
  | "patrimonio_sem_tombamento"    // ativo sem registro de patrimônio
  | "estoque_abaixo_minimo";       // quantidade_disponivel < estoque_minimo

export type StatusPendencia = "aberta" | "resolvida" | "ignorada";

export interface Pendencia {
  pendencia_id: string;
  tipo: TipoPendencia;
  status: StatusPendencia;
  entidade: string;       // ex: "EQUIPAMENTOS", "ALOCACOES", "ESTOQUE"
  entidade_id: string;    // ID da entidade relacionada
  titulo: string;
  descricao?: string;
  resolvida_em?: string;
  resolvida_por?: string;
  created_at: string;
  updated_at: string;
}
