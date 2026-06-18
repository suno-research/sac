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
