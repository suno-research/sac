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
