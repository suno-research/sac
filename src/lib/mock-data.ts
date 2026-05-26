// ============================================================
// SAC — Suno Access Control — Dados Mockados
// ============================================================

export type Perfil = "TI" | "Gestor";

export type StatusFuncionario = "Ativo" | "Desligado";

export type AreaEmpresa =
  | "TI"
  | "Marketing"
  | "Financeiro"
  | "Editorial"
  | "Comercial"
  | "RH"
  | "Jurídico"
  | "Operações";

export type CategoriaFerramenta =
  | "Comunicação"
  | "Analytics"
  | "Desenvolvimento"
  | "Financeiro"
  | "Marketing"
  | "Produtividade"
  | "Segurança"
  | "Infraestrutura";

export type TipoAcesso = "Individual" | "Passbolt";

export type StatusAcesso =
  | "Ativo"
  | "Pendente concessão"
  | "Pendente remoção"
  | "Sem acesso";

export type StatusOffboarding = "Em andamento" | "Concluído";

export type TipoMovimentacao = "onboarding" | "offboarding";

export type StatusMovimentacao = "Concluído" | "Em andamento" | "Pendente";

// ---- Ferramenta ----
export interface Ferramenta {
  id: string;
  nome: string;
  categoria: CategoriaFerramenta;
  tipo: TipoAcesso;
  url: string;
  descricao: string;
}

// ---- Funcionário ----
export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  area: AreaEmpresa;
  gestorId: string | null;
  status: StatusFuncionario;
  dataEntrada: string;
  dataDesligamento?: string;
  avatar?: string;
}

// ---- Acesso de Funcionário a Ferramenta ----
export interface AcessoFuncionario {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: StatusAcesso;
  dataConcessao?: string;
  concedidoPor?: string;
}

// ---- Item de Offboarding ----
export interface ItemOffboarding {
  id: string;
  ferramentaId: string;
  removido: boolean;
  tipoRemocao: "Remover usuário" | "Trocar senha no Passbolt";
  observacao?: string;
  dataRemocao?: string;
  removidoPor?: string;
}

// ---- Offboarding ----
export interface Offboarding {
  id: string;
  funcionarioId: string;
  dataDesligamento: string;
  dataInicio: string;
  dataConclusao?: string;
  status: StatusOffboarding;
  itens: ItemOffboarding[];
  responsavelId: string;
}

// ---- Perfil Padrão ----
export interface PerfilPadrao {
  id: string;
  cargo: string;
  area: AreaEmpresa;
  ferramentaIds: string[];
  descricao: string;
}

// ---- Movimentação ----
export interface Movimentacao {
  id: string;
  funcionarioId: string;
  tipo: TipoMovimentacao;
  data: string;
  status: StatusMovimentacao;
}

// =============================
// FERRAMENTAS
// =============================
export const ferramentas: Ferramenta[] = [
  { id: "f01", nome: "Google Workspace", categoria: "Produtividade", tipo: "Individual", url: "https://workspace.google.com", descricao: "Gmail, Drive, Docs, Sheets, Meet" },
  { id: "f02", nome: "Monday.com", categoria: "Produtividade", tipo: "Individual", url: "https://monday.com", descricao: "Gestão de projetos e tarefas" },
  { id: "f03", nome: "Claude (Anthropic)", categoria: "Produtividade", tipo: "Individual", url: "https://claude.ai", descricao: "Assistente de IA para produtividade" },
  { id: "f04", nome: "Notion", categoria: "Produtividade", tipo: "Individual", url: "https://notion.so", descricao: "Base de conhecimento e documentação" },
  { id: "f05", nome: "Power BI", categoria: "Analytics", tipo: "Individual", url: "https://powerbi.microsoft.com", descricao: "Business intelligence e dashboards" },
  { id: "f06", nome: "WordPress", categoria: "Marketing", tipo: "Individual", url: "https://wordpress.com", descricao: "CMS do blog Suno" },
  { id: "f07", nome: "Passbolt", categoria: "Segurança", tipo: "Passbolt", url: "https://passbolt.suno.com.br", descricao: "Gerenciador de senhas corporativo" },
  { id: "f08", nome: "Slack", categoria: "Comunicação", tipo: "Individual", url: "https://slack.com", descricao: "Comunicação interna da equipe" },
  { id: "f09", nome: "GitHub", categoria: "Desenvolvimento", tipo: "Individual", url: "https://github.com", descricao: "Repositórios de código-fonte" },
  { id: "f10", nome: "Vercel", categoria: "Infraestrutura", tipo: "Individual", url: "https://vercel.com", descricao: "Deploy e hosting de aplicações" },
  { id: "f11", nome: "Supabase", categoria: "Infraestrutura", tipo: "Individual", url: "https://supabase.com", descricao: "Banco de dados e backend as a service" },
  { id: "f12", nome: "n8n", categoria: "Infraestrutura", tipo: "Passbolt", url: "https://n8n.suno.com.br", descricao: "Automação de workflows" },
  { id: "f13", nome: "Hotmart", categoria: "Financeiro", tipo: "Individual", url: "https://hotmart.com", descricao: "Plataforma de produtos digitais" },
  { id: "f14", nome: "RD Station", categoria: "Marketing", tipo: "Individual", url: "https://rdstation.com", descricao: "CRM e automação de marketing" },
  { id: "f15", nome: "Meta Ads", categoria: "Marketing", tipo: "Passbolt", url: "https://business.facebook.com", descricao: "Anúncios no Facebook e Instagram" },
  { id: "f16", nome: "Google Analytics", categoria: "Analytics", tipo: "Individual", url: "https://analytics.google.com", descricao: "Análise de tráfego web" },
  { id: "f17", nome: "Google Search Console", categoria: "Analytics", tipo: "Individual", url: "https://search.google.com/search-console", descricao: "Monitoramento de SEO" },
  { id: "f18", nome: "Semrush", categoria: "Marketing", tipo: "Individual", url: "https://semrush.com", descricao: "Ferramentas de SEO e marketing digital" },
  { id: "f19", nome: "Figma", categoria: "Produtividade", tipo: "Individual", url: "https://figma.com", descricao: "Design de interfaces e prototipagem" },
  { id: "f20", nome: "Canva", categoria: "Marketing", tipo: "Individual", url: "https://canva.com", descricao: "Criação de artes e conteúdo visual" },
  { id: "f21", nome: "Stripe", categoria: "Financeiro", tipo: "Individual", url: "https://stripe.com", descricao: "Processamento de pagamentos" },
  { id: "f22", nome: "Conta Azul", categoria: "Financeiro", tipo: "Individual", url: "https://contaazul.com", descricao: "ERP e gestão financeira" },
  { id: "f23", nome: "Suno Core", categoria: "Infraestrutura", tipo: "Individual", url: "https://core.suno.com.br", descricao: "Sistema interno de gestão de assinantes" },
  { id: "f24", nome: "Intranet Suno", categoria: "Produtividade", tipo: "Individual", url: "https://intranet.suno.com.br", descricao: "Portal interno da Suno" },
  { id: "f25", nome: "LinkedIn Ads", categoria: "Marketing", tipo: "Passbolt", url: "https://business.linkedin.com", descricao: "Anúncios no LinkedIn" },
];

// =============================
// FUNCIONÁRIOS
// =============================
export const funcionarios: Funcionario[] = [
  { id: "u01", nome: "Daniel Lopes", email: "daniel.lopes@suno.com.br", cargo: "Tech Lead", area: "TI", gestorId: null, status: "Ativo", dataEntrada: "2021-03-01" },
  { id: "u02", nome: "Fernanda Alves", email: "fernanda.alves@suno.com.br", cargo: "Desenvolvedora Full Stack", area: "TI", gestorId: "u01", status: "Ativo", dataEntrada: "2022-06-15" },
  { id: "u03", nome: "Rafael Souza", email: "rafael.souza@suno.com.br", cargo: "DevOps Engineer", area: "TI", gestorId: "u01", status: "Ativo", dataEntrada: "2022-11-01" },
  { id: "u04", nome: "Camila Martins", email: "camila.martins@suno.com.br", cargo: "Head de Marketing", area: "Marketing", gestorId: null, status: "Ativo", dataEntrada: "2020-08-10" },
  { id: "u05", nome: "Bruno Costa", email: "bruno.costa@suno.com.br", cargo: "Analista de Marketing Digital", area: "Marketing", gestorId: "u04", status: "Ativo", dataEntrada: "2023-01-16" },
  { id: "u06", nome: "Letícia Ferreira", email: "leticia.ferreira@suno.com.br", cargo: "Analista de SEO", area: "Marketing", gestorId: "u04", status: "Ativo", dataEntrada: "2023-04-03" },
  { id: "u07", nome: "Gustavo Pereira", email: "gustavo.pereira@suno.com.br", cargo: "Analista Financeiro Sênior", area: "Financeiro", gestorId: null, status: "Ativo", dataEntrada: "2021-09-20" },
  { id: "u08", nome: "Mariana Santos", email: "mariana.santos@suno.com.br", cargo: "Analista Financeiro", area: "Financeiro", gestorId: "u07", status: "Ativo", dataEntrada: "2023-07-10" },
  { id: "u09", nome: "Thiago Oliveira", email: "thiago.oliveira@suno.com.br", cargo: "Editor-chefe", area: "Editorial", gestorId: null, status: "Ativo", dataEntrada: "2020-02-01" },
  { id: "u10", nome: "Isabela Nunes", email: "isabela.nunes@suno.com.br", cargo: "Redatora de Conteúdo", area: "Editorial", gestorId: "u09", status: "Ativo", dataEntrada: "2023-02-20" },
  { id: "u11", nome: "Pedro Carvalho", email: "pedro.carvalho@suno.com.br", cargo: "Analista Comercial", area: "Comercial", gestorId: null, status: "Ativo", dataEntrada: "2022-03-07" },
  { id: "u12", nome: "Ana Paula Lima", email: "ana.lima@suno.com.br", cargo: "Analista Comercial", area: "Comercial", gestorId: "u11", status: "Ativo", dataEntrada: "2023-09-04" },
  { id: "u13", nome: "Carlos Mendes", email: "carlos.mendes@suno.com.br", cargo: "Designer UX/UI", area: "Marketing", gestorId: "u04", status: "Desligado", dataEntrada: "2021-05-12", dataDesligamento: "2024-11-30" },
  { id: "u14", nome: "Juliana Ramos", email: "juliana.ramos@suno.com.br", cargo: "Analista de Dados", area: "TI", gestorId: "u01", status: "Desligado", dataEntrada: "2022-08-01", dataDesligamento: "2025-03-15" },
  { id: "u15", nome: "Rodrigo Teixeira", email: "rodrigo.teixeira@suno.com.br", cargo: "Especialista em Infraestrutura", area: "TI", gestorId: "u01", status: "Ativo", dataEntrada: "2024-01-08" },
];

// =============================
// ACESSOS
// =============================
export const acessos: AcessoFuncionario[] = [
  // Daniel Lopes (u01) - TI, acesso total
  { id: "a001", funcionarioId: "u01", ferramentaId: "f01", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a002", funcionarioId: "u01", ferramentaId: "f02", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a003", funcionarioId: "u01", ferramentaId: "f03", status: "Ativo", dataConcessao: "2023-01-10", concedidoPor: "Sistema" },
  { id: "a004", funcionarioId: "u01", ferramentaId: "f07", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a005", funcionarioId: "u01", ferramentaId: "f08", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a006", funcionarioId: "u01", ferramentaId: "f09", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a007", funcionarioId: "u01", ferramentaId: "f10", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a008", funcionarioId: "u01", ferramentaId: "f11", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a009", funcionarioId: "u01", ferramentaId: "f12", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a010", funcionarioId: "u01", ferramentaId: "f23", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a011", funcionarioId: "u01", ferramentaId: "f24", status: "Ativo", dataConcessao: "2021-03-01", concedidoPor: "Sistema" },
  { id: "a012", funcionarioId: "u01", ferramentaId: "f04", status: "Ativo", dataConcessao: "2021-06-01", concedidoPor: "Sistema" },

  // Fernanda Alves (u02) - Desenvolvedora
  { id: "a020", funcionarioId: "u02", ferramentaId: "f01", status: "Ativo", dataConcessao: "2022-06-15", concedidoPor: "u01" },
  { id: "a021", funcionarioId: "u02", ferramentaId: "f08", status: "Ativo", dataConcessao: "2022-06-15", concedidoPor: "u01" },
  { id: "a022", funcionarioId: "u02", ferramentaId: "f09", status: "Ativo", dataConcessao: "2022-06-15", concedidoPor: "u01" },
  { id: "a023", funcionarioId: "u02", ferramentaId: "f10", status: "Ativo", dataConcessao: "2022-06-15", concedidoPor: "u01" },
  { id: "a024", funcionarioId: "u02", ferramentaId: "f11", status: "Ativo", dataConcessao: "2022-06-15", concedidoPor: "u01" },
  { id: "a025", funcionarioId: "u02", ferramentaId: "f03", status: "Ativo", dataConcessao: "2023-03-01", concedidoPor: "u01" },
  { id: "a026", funcionarioId: "u02", ferramentaId: "f04", status: "Pendente concessão", concedidoPor: "u01" },
  { id: "a027", funcionarioId: "u02", ferramentaId: "f02", status: "Ativo", dataConcessao: "2022-06-20", concedidoPor: "u01" },

  // Rafael Souza (u03) - DevOps
  { id: "a030", funcionarioId: "u03", ferramentaId: "f01", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a031", funcionarioId: "u03", ferramentaId: "f08", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a032", funcionarioId: "u03", ferramentaId: "f09", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a033", funcionarioId: "u03", ferramentaId: "f10", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a034", funcionarioId: "u03", ferramentaId: "f11", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a035", funcionarioId: "u03", ferramentaId: "f12", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a036", funcionarioId: "u03", ferramentaId: "f07", status: "Ativo", dataConcessao: "2022-11-01", concedidoPor: "u01" },
  { id: "a037", funcionarioId: "u03", ferramentaId: "f23", status: "Pendente concessão", concedidoPor: "u01" },

  // Camila Martins (u04) - Head de Marketing
  { id: "a040", funcionarioId: "u04", ferramentaId: "f01", status: "Ativo", dataConcessao: "2020-08-10", concedidoPor: "Sistema" },
  { id: "a041", funcionarioId: "u04", ferramentaId: "f02", status: "Ativo", dataConcessao: "2020-08-10", concedidoPor: "Sistema" },
  { id: "a042", funcionarioId: "u04", ferramentaId: "f08", status: "Ativo", dataConcessao: "2020-08-10", concedidoPor: "Sistema" },
  { id: "a043", funcionarioId: "u04", ferramentaId: "f14", status: "Ativo", dataConcessao: "2020-09-01", concedidoPor: "Sistema" },
  { id: "a044", funcionarioId: "u04", ferramentaId: "f15", status: "Ativo", dataConcessao: "2020-09-01", concedidoPor: "Sistema" },
  { id: "a045", funcionarioId: "u04", ferramentaId: "f16", status: "Ativo", dataConcessao: "2020-09-01", concedidoPor: "Sistema" },
  { id: "a046", funcionarioId: "u04", ferramentaId: "f18", status: "Ativo", dataConcessao: "2021-01-15", concedidoPor: "u01" },
  { id: "a047", funcionarioId: "u04", ferramentaId: "f19", status: "Ativo", dataConcessao: "2021-01-15", concedidoPor: "u01" },
  { id: "a048", funcionarioId: "u04", ferramentaId: "f20", status: "Ativo", dataConcessao: "2021-01-15", concedidoPor: "u01" },
  { id: "a049", funcionarioId: "u04", ferramentaId: "f25", status: "Ativo", dataConcessao: "2022-03-01", concedidoPor: "u01" },

  // Bruno Costa (u05) - Marketing Digital
  { id: "a050", funcionarioId: "u05", ferramentaId: "f01", status: "Ativo", dataConcessao: "2023-01-16", concedidoPor: "u01" },
  { id: "a051", funcionarioId: "u05", ferramentaId: "f08", status: "Ativo", dataConcessao: "2023-01-16", concedidoPor: "u01" },
  { id: "a052", funcionarioId: "u05", ferramentaId: "f14", status: "Ativo", dataConcessao: "2023-01-20", concedidoPor: "u01" },
  { id: "a053", funcionarioId: "u05", ferramentaId: "f15", status: "Ativo", dataConcessao: "2023-01-20", concedidoPor: "u01" },
  { id: "a054", funcionarioId: "u05", ferramentaId: "f16", status: "Ativo", dataConcessao: "2023-01-20", concedidoPor: "u01" },
  { id: "a055", funcionarioId: "u05", ferramentaId: "f20", status: "Ativo", dataConcessao: "2023-01-20", concedidoPor: "u01" },
  { id: "a056", funcionarioId: "u05", ferramentaId: "f25", status: "Pendente concessão", concedidoPor: "u01" },
  { id: "a057", funcionarioId: "u05", ferramentaId: "f03", status: "Pendente concessão", concedidoPor: "u01" },

  // Letícia Ferreira (u06) - SEO
  { id: "a060", funcionarioId: "u06", ferramentaId: "f01", status: "Ativo", dataConcessao: "2023-04-03", concedidoPor: "u01" },
  { id: "a061", funcionarioId: "u06", ferramentaId: "f08", status: "Ativo", dataConcessao: "2023-04-03", concedidoPor: "u01" },
  { id: "a062", funcionarioId: "u06", ferramentaId: "f16", status: "Ativo", dataConcessao: "2023-04-05", concedidoPor: "u01" },
  { id: "a063", funcionarioId: "u06", ferramentaId: "f17", status: "Ativo", dataConcessao: "2023-04-05", concedidoPor: "u01" },
  { id: "a064", funcionarioId: "u06", ferramentaId: "f18", status: "Ativo", dataConcessao: "2023-04-05", concedidoPor: "u01" },
  { id: "a065", funcionarioId: "u06", ferramentaId: "f06", status: "Ativo", dataConcessao: "2023-04-10", concedidoPor: "u01" },

  // Gustavo Pereira (u07) - Financeiro Sênior
  { id: "a070", funcionarioId: "u07", ferramentaId: "f01", status: "Ativo", dataConcessao: "2021-09-20", concedidoPor: "Sistema" },
  { id: "a071", funcionarioId: "u07", ferramentaId: "f08", status: "Ativo", dataConcessao: "2021-09-20", concedidoPor: "Sistema" },
  { id: "a072", funcionarioId: "u07", ferramentaId: "f05", status: "Ativo", dataConcessao: "2021-10-01", concedidoPor: "u01" },
  { id: "a073", funcionarioId: "u07", ferramentaId: "f21", status: "Ativo", dataConcessao: "2021-10-01", concedidoPor: "u01" },
  { id: "a074", funcionarioId: "u07", ferramentaId: "f22", status: "Ativo", dataConcessao: "2021-10-01", concedidoPor: "u01" },
  { id: "a075", funcionarioId: "u07", ferramentaId: "f13", status: "Ativo", dataConcessao: "2021-10-01", concedidoPor: "u01" },

  // Mariana Santos (u08) - Financeiro
  { id: "a080", funcionarioId: "u08", ferramentaId: "f01", status: "Ativo", dataConcessao: "2023-07-10", concedidoPor: "u01" },
  { id: "a081", funcionarioId: "u08", ferramentaId: "f08", status: "Ativo", dataConcessao: "2023-07-10", concedidoPor: "u01" },
  { id: "a082", funcionarioId: "u08", ferramentaId: "f05", status: "Pendente concessão", concedidoPor: "u01" },
  { id: "a083", funcionarioId: "u08", ferramentaId: "f22", status: "Ativo", dataConcessao: "2023-07-15", concedidoPor: "u01" },

  // Thiago Oliveira (u09) - Editor-chefe
  { id: "a090", funcionarioId: "u09", ferramentaId: "f01", status: "Ativo", dataConcessao: "2020-02-01", concedidoPor: "Sistema" },
  { id: "a091", funcionarioId: "u09", ferramentaId: "f08", status: "Ativo", dataConcessao: "2020-02-01", concedidoPor: "Sistema" },
  { id: "a092", funcionarioId: "u09", ferramentaId: "f06", status: "Ativo", dataConcessao: "2020-02-01", concedidoPor: "Sistema" },
  { id: "a093", funcionarioId: "u09", ferramentaId: "f04", status: "Ativo", dataConcessao: "2020-02-01", concedidoPor: "Sistema" },
  { id: "a094", funcionarioId: "u09", ferramentaId: "f03", status: "Ativo", dataConcessao: "2023-06-01", concedidoPor: "u01" },

  // Isabela Nunes (u10) - Redatora
  { id: "a100", funcionarioId: "u10", ferramentaId: "f01", status: "Ativo", dataConcessao: "2023-02-20", concedidoPor: "u01" },
  { id: "a101", funcionarioId: "u10", ferramentaId: "f08", status: "Ativo", dataConcessao: "2023-02-20", concedidoPor: "u01" },
  { id: "a102", funcionarioId: "u10", ferramentaId: "f06", status: "Ativo", dataConcessao: "2023-02-22", concedidoPor: "u01" },
  { id: "a103", funcionarioId: "u10", ferramentaId: "f04", status: "Ativo", dataConcessao: "2023-02-22", concedidoPor: "u01" },
  { id: "a104", funcionarioId: "u10", ferramentaId: "f03", status: "Pendente concessão", concedidoPor: "u01" },

  // Pedro Carvalho (u11) - Comercial
  { id: "a110", funcionarioId: "u11", ferramentaId: "f01", status: "Ativo", dataConcessao: "2022-03-07", concedidoPor: "Sistema" },
  { id: "a111", funcionarioId: "u11", ferramentaId: "f08", status: "Ativo", dataConcessao: "2022-03-07", concedidoPor: "Sistema" },
  { id: "a112", funcionarioId: "u11", ferramentaId: "f23", status: "Ativo", dataConcessao: "2022-03-10", concedidoPor: "u01" },
  { id: "a113", funcionarioId: "u11", ferramentaId: "f02", status: "Ativo", dataConcessao: "2022-03-10", concedidoPor: "u01" },

  // Ana Paula Lima (u12) - Comercial
  { id: "a120", funcionarioId: "u12", ferramentaId: "f01", status: "Ativo", dataConcessao: "2023-09-04", concedidoPor: "u01" },
  { id: "a121", funcionarioId: "u12", ferramentaId: "f08", status: "Ativo", dataConcessao: "2023-09-04", concedidoPor: "u01" },
  { id: "a122", funcionarioId: "u12", ferramentaId: "f23", status: "Pendente concessão", concedidoPor: "u01" },
  { id: "a123", funcionarioId: "u12", ferramentaId: "f02", status: "Ativo", dataConcessao: "2023-09-10", concedidoPor: "u01" },

  // Carlos Mendes (u13) - Desligado
  { id: "a130", funcionarioId: "u13", ferramentaId: "f01", status: "Sem acesso" },
  { id: "a131", funcionarioId: "u13", ferramentaId: "f08", status: "Sem acesso" },
  { id: "a132", funcionarioId: "u13", ferramentaId: "f19", status: "Sem acesso" },
  { id: "a133", funcionarioId: "u13", ferramentaId: "f20", status: "Sem acesso" },

  // Juliana Ramos (u14) - Desligada (offboarding em andamento)
  { id: "a140", funcionarioId: "u14", ferramentaId: "f01", status: "Pendente remoção" },
  { id: "a141", funcionarioId: "u14", ferramentaId: "f08", status: "Pendente remoção" },
  { id: "a142", funcionarioId: "u14", ferramentaId: "f09", status: "Pendente remoção" },
  { id: "a143", funcionarioId: "u14", ferramentaId: "f05", status: "Pendente remoção" },
  { id: "a144", funcionarioId: "u14", ferramentaId: "f11", status: "Pendente remoção" },

  // Rodrigo Teixeira (u15) - Infra
  { id: "a150", funcionarioId: "u15", ferramentaId: "f01", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a151", funcionarioId: "u15", ferramentaId: "f08", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a152", funcionarioId: "u15", ferramentaId: "f09", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a153", funcionarioId: "u15", ferramentaId: "f10", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a154", funcionarioId: "u15", ferramentaId: "f11", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a155", funcionarioId: "u15", ferramentaId: "f12", status: "Ativo", dataConcessao: "2024-01-08", concedidoPor: "u01" },
  { id: "a156", funcionarioId: "u15", ferramentaId: "f07", status: "Pendente concessão", concedidoPor: "u01" },
];

// =============================
// OFFBOARDINGS
// =============================
export const offboardings: Offboarding[] = [
  {
    id: "off01",
    funcionarioId: "u13", // Carlos Mendes — concluído
    dataDesligamento: "2024-11-30",
    dataInicio: "2024-11-28",
    dataConclusao: "2024-12-02",
    status: "Concluído",
    responsavelId: "u01",
    itens: [
      { id: "oi01", ferramentaId: "f01", removido: true, tipoRemocao: "Remover usuário", dataRemocao: "2024-12-01", removidoPor: "u01", observacao: "" },
      { id: "oi02", ferramentaId: "f08", removido: true, tipoRemocao: "Remover usuário", dataRemocao: "2024-12-01", removidoPor: "u01", observacao: "" },
      { id: "oi03", ferramentaId: "f19", removido: true, tipoRemocao: "Remover usuário", dataRemocao: "2024-12-02", removidoPor: "u01", observacao: "Transferido para Camila Martins" },
      { id: "oi04", ferramentaId: "f20", removido: true, tipoRemocao: "Remover usuário", dataRemocao: "2024-12-02", removidoPor: "u01", observacao: "" },
    ],
  },
  {
    id: "off02",
    funcionarioId: "u14", // Juliana Ramos — em andamento
    dataDesligamento: "2025-03-15",
    dataInicio: "2025-03-13",
    status: "Em andamento",
    responsavelId: "u01",
    itens: [
      { id: "oi10", ferramentaId: "f01", removido: true, tipoRemocao: "Remover usuário", dataRemocao: "2025-03-14", removidoPor: "u01", observacao: "" },
      { id: "oi11", ferramentaId: "f08", removido: false, tipoRemocao: "Remover usuário", observacao: "" },
      { id: "oi12", ferramentaId: "f09", removido: false, tipoRemocao: "Remover usuário", observacao: "" },
      { id: "oi13", ferramentaId: "f05", removido: false, tipoRemocao: "Remover usuário", observacao: "" },
      { id: "oi14", ferramentaId: "f11", removido: false, tipoRemocao: "Remover usuário", observacao: "" },
    ],
  },
];

// =============================
// PERFIS PADRÃO
// =============================
export const perfisPadrao: PerfilPadrao[] = [
  {
    id: "pp01",
    cargo: "Desenvolvedor(a)",
    area: "TI",
    ferramentaIds: ["f01", "f02", "f03", "f04", "f07", "f08", "f09", "f10", "f11", "f23", "f24"],
    descricao: "Pacote padrão para desenvolvedores da equipe de TI. Inclui ferramentas de comunicação, desenvolvimento, infraestrutura e acesso ao core.",
  },
  {
    id: "pp02",
    cargo: "Analista de Marketing Digital",
    area: "Marketing",
    ferramentaIds: ["f01", "f02", "f03", "f08", "f14", "f15", "f16", "f17", "f18", "f20", "f24", "f25"],
    descricao: "Pacote para analistas de marketing. Cobre ferramentas de CRM, mídia paga, SEO e criação de conteúdo visual.",
  },
  {
    id: "pp03",
    cargo: "Analista Financeiro",
    area: "Financeiro",
    ferramentaIds: ["f01", "f02", "f05", "f08", "f13", "f21", "f22", "f24"],
    descricao: "Pacote para analistas financeiros. Inclui BI, ERP, plataformas de pagamento e gestão financeira.",
  },
];

// =============================
// MOVIMENTAÇÕES
// =============================
export const movimentacoes: Movimentacao[] = [
  { id: "m01", funcionarioId: "u15", tipo: "onboarding", data: "2024-01-08", status: "Concluído" },
  { id: "m02", funcionarioId: "u12", tipo: "onboarding", data: "2023-09-04", status: "Concluído" },
  { id: "m03", funcionarioId: "u08", tipo: "onboarding", data: "2023-07-10", status: "Concluído" },
  { id: "m04", funcionarioId: "u14", tipo: "offboarding", data: "2025-03-13", status: "Em andamento" },
  { id: "m05", funcionarioId: "u13", tipo: "offboarding", data: "2024-11-28", status: "Concluído" },
  { id: "m06", funcionarioId: "u10", tipo: "onboarding", data: "2023-02-20", status: "Concluído" },
  { id: "m07", funcionarioId: "u05", tipo: "onboarding", data: "2023-01-16", status: "Concluído" },
];

// =============================
// HELPERS
// =============================
export function getFuncionarioById(id: string): Funcionario | undefined {
  return funcionarios.find((f) => f.id === id);
}

export function getFerramentaById(id: string): Ferramenta | undefined {
  return ferramentas.find((f) => f.id === id);
}

export function getAcessosByFuncionario(funcionarioId: string): AcessoFuncionario[] {
  return acessos.filter((a) => a.funcionarioId === funcionarioId);
}

export function getOffboardingByFuncionario(funcionarioId: string): Offboarding | undefined {
  return offboardings.find((o) => o.funcionarioId === funcionarioId);
}

export function getNomeFuncionario(id: string): string {
  return getFuncionarioById(id)?.nome ?? "—";
}

export function countAcessosAtivos(): number {
  return acessos.filter((a) => a.status === "Ativo").length;
}

export function countPendentesConcessao(): number {
  return acessos.filter((a) => a.status === "Pendente concessão").length;
}

export function countPendentesRemocao(): number {
  return acessos.filter((a) => a.status === "Pendente remoção").length;
}

export function countFuncionariosAtivos(): number {
  return funcionarios.filter((f) => f.status === "Ativo").length;
}

export function getTotalUsuariosAtivos(ferramentaId: string): number {
  return acessos.filter((a) => a.ferramentaId === ferramentaId && a.status === "Ativo").length;
}
