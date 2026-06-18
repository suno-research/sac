/**
 * SEC — Script de Importação de Inventário
 * Lê a planilha de origem (Computadores + Celulares) e grava na planilha SEC.
 *
 * Uso:
 *   node sec-import.js
 *
 * Variáveis de ambiente necessárias (no .env.local do projeto):
 *   GOOGLE_SHEETS_SEC_ID         → ID da planilha SEC
 *   GOOGLE_SERVICE_ACCOUNT_KEY   → JSON da service account (string JSON)
 *   IMPORT_SOURCE_SHEET_ID       → ID da planilha de origem (inventário)
 *
 * Rodar da raiz do projeto:
 *   node src/scripts/sec-import.js
 *
 * O script:
 *   1. Lê aba "Computadores" da planilha de origem
 *   2. Lê aba "Celulares" da planilha de origem
 *   3. Transforma cada linha no formato da aba EQUIPAMENTOS do SEC
 *   4. Grava em lotes na aba EQUIPAMENTOS da planilha SEC
 *   5. Grava 1 linha em _AUDITORIA por registro importado
 *   6. Gera import-log.txt com resumo e erros
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// ─── Carregar .env.local ──────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

// ─── Configuração ─────────────────────────────────────────────────────────────
const SEC_SHEET_ID    = process.env.GOOGLE_SHEETS_SEC_ID;
const SOURCE_SHEET_ID = process.env.IMPORT_SOURCE_SHEET_ID;
const SERVICE_ACCOUNT = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
const IMPORT_USER     = process.env.IMPORT_USER_EMAIL || "sistema@suno.com.br";

if (!SEC_SHEET_ID || !SOURCE_SHEET_ID) {
  console.error("❌ GOOGLE_SHEETS_SEC_ID e IMPORT_SOURCE_SHEET_ID são obrigatórios no .env.local");
  process.exit(1);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function generateId(prefix) {
  const now   = new Date();
  const date  = now.toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand  = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${date}-${rand}`;
}

function generateAuditId() {
  const now      = new Date();
  const datePart = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const seq      = String(now.getMilliseconds()).padStart(4, "0");
  return `AUD-${datePart}-${seq}`;
}

function now() {
  return new Date().toISOString();
}

function clean(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

// ─── Mapeamentos ──────────────────────────────────────────────────────────────
const TIPO_MAP = {
  "Notebook": "notebook",
  "Macbook":  "notebook",
  "Desktop":  "desktop",
  "iMac":     "desktop",
  "Mini PC":  "outro",
  "Celular":  "telefone",
  "Smartphone": "telefone",
};

const MODELO_NORMALIZE = {
  "Moto g(9) play":  "Moto G9 Play",
  "MotoG9 play":     "Moto G9 Play",
  "MOTO G35":        "Moto G35",
  "Moto G35 ":       "Moto G35",
  "Moto G84 ":       "Moto G84",
  "Moto G35 5G":     "Moto G35",
  "Galaxy- A14":     "Galaxy A14",
  "Samsung A10s":    "Galaxy A10s",
};

function normalizarModelo(m) {
  if (!m) return "";
  const trimmed = String(m).trim();
  return MODELO_NORMALIZE[trimmed] || trimmed;
}

// ─── Leitura da planilha de origem ───────────────────────────────────────────
async function lerAba(sheets, sheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

// ─── Transformação: Computadores → Ativo ──────────────────────────────────────
/**
 * Colunas da aba Computadores (0-based):
 * 0:  proprietario
 * 1:  Empresa
 * 2:  Atendido
 * 3:  Nome completo do colaborador
 * 4:  Equipamento (tipo)
 * 5:  Fabricante
 * 6:  Login
 * 7:  Wazuh
 * 8:  Modelo
 * 9:  RAM
 * 10: Processador
 * 11: Sistema Operacional
 * 12: S/N
 * 13: Serial Win.
 * 14: Antivírus
 * 15: hostname
 * 16: HD. GB
 * 17: Permissão Win.
 * 18: Termo
 * 19: Anydesk
 * 20: Observação
 */
function transformarComputador(row, log) {
  const tipoRaw    = clean(row[4]);
  const fabricante = clean(row[5]);
  const modelo     = clean(row[8]);
  const nome       = clean(row[3]);
  const sn         = clean(row[12]);

  const TIPOS_VALIDOS = new Set(["Notebook", "Desktop", "Mini PC", "Macbook", "iMac"]);

  if (!TIPOS_VALIDOS.has(tipoRaw)) {
    log.ignoradas.push(`Tipo inválido: '${tipoRaw}' (linha com nome: '${nome}')`);
    return null;
  }

  if (!nome) {
    log.ignoradas.push(`Nome vazio para linha tipo '${tipoRaw}' S/N '${sn}'`);
    return null;
  }

  const tipo  = TIPO_MAP[tipoRaw] || "outro";
  const nomeAtivo = fabricante && modelo
    ? `${fabricante} ${modelo}`
    : fabricante || modelo || `${tipoRaw} sem modelo`;

  // Construir observação sem dados sensíveis
  const partsObs = [];
  const obs = clean(row[20]);
  if (obs) partsObs.push(obs);
  const termo = clean(row[18]);
  if (termo && termo !== "Enviar" && termo !== "Assinado" && termo !== "-") {
    partsObs.push(`Termo: ${termo}`);
  }
  const proprietario = clean(row[0]);
  if (proprietario && proprietario !== "Suno") {
    partsObs.push(`Propriedade: ${proprietario}`);
  }

  return {
    nome:             nomeAtivo,
    tipo,
    marca:            fabricante || "Desconhecido",
    modelo:           modelo || tipoRaw,
    numero_serie:     sn,
    status:           "ativo",
    localizacao_atual: "",
    observacoes:      partsObs.join(" | "),
    // Metadados para responsabilidades (Sprint 4)
    _responsavel_nome: nome,
  };
}

// ─── Transformação: Celulares → Ativo ─────────────────────────────────────────
/**
 * Seção 1 (linhas 2-202):
 * 0: edu (número/chip)
 * 1: Empresa
 * 2: Atendido por
 * 3: Nome completo
 * 4: Equipamento (Suno/Pessoal/Somente chip)
 * 5: Fabricante
 * 6: Modelo
 * 7: IMEI 1
 * 8: IMEI 2
 * 9: Número de série (MSN)
 * 10: Termo
 * 11: Observação
 *
 * Seção 2 (linhas 204+):
 * 0: Cel. avulso (número/chip)
 * 1: Empresa
 * 2: Atendente
 * 3: Nome/uso
 * 4: Empresa do celular
 * 5: Fabricante
 * 6: Modelo
 * 7: Observação 1 (MSN está em posição diferente)
 * 9: N/S Celular (MSN)
 */
function transformarCelular(row, secao, log) {
  const FABRICANTES_VALIDOS = new Set(["Motorola", "Samsung", "Apple"]);
  const MODELOS_IGNORAR = new Set([
    "Equipamento", "Antivírus", "N/S Celular", "Instalar",
    "verificar os dados do smartphone", "era do Rafi",
    "Somente chip", "Nenhum",
  ]);

  const fab   = clean(row[5]);
  const modeloRaw = clean(row[6]);
  const nome  = clean(row[3]);

  if (!FABRICANTES_VALIDOS.has(fab)) return null;
  if (!modeloRaw || MODELOS_IGNORAR.has(modeloRaw)) return null;
  if (!isNaN(Number(modeloRaw)) && modeloRaw !== "") return null; // número puro = dado de outra coluna

  // MSN: posição varia por seção
  const msn = secao === 1 ? clean(row[9]) : clean(row[9]);

  const modelo = normalizarModelo(modeloRaw);
  const nomeAtivo = `${fab} ${modelo}`;

  const obs = secao === 1 ? clean(row[11]) : clean(row[7]);

  const partsObs = [];
  if (obs) partsObs.push(obs);
  const imei1 = secao === 1 ? clean(row[7]) : "";
  if (imei1 && imei1.length > 10) partsObs.push(`IMEI: ${imei1}`);

  return {
    nome:              nomeAtivo,
    tipo:              "telefone",
    marca:             fab,
    modelo,
    numero_serie:      msn,
    status:            "ativo",
    localizacao_atual: "",
    observacoes:       partsObs.join(" | "),
    _responsavel_nome: nome,
  };
}

// ─── Converter Ativo → linha para EQUIPAMENTOS ────────────────────────────────
/**
 * Ordem das colunas na aba EQUIPAMENTOS (A–U):
 * 0:  equipamento_id
 * 1:  nome
 * 2:  tipo
 * 3:  marca
 * 4:  modelo
 * 5:  numero_serie
 * 6:  numero_patrimonio
 * 7:  status
 * 8:  localizacao_atual
 * 9:  data_aquisicao
 * 10: valor_aquisicao
 * 11: fornecedor
 * 12: nota_fiscal
 * 13: garantia_ate
 * 14: observacoes
 * 15: created_at
 * 16: created_by
 * 17: updated_at
 * 18: updated_by
 * 19: deleted_at
 * 20: deleted_by
 */
function ativoToRow(ativo) {
  return [
    ativo.equipamento_id,
    ativo.nome,
    ativo.tipo,
    ativo.marca,
    ativo.modelo,
    ativo.numero_serie,
    "",                    // numero_patrimonio
    ativo.status,
    ativo.localizacao_atual,
    "",                    // data_aquisicao
    "",                    // valor_aquisicao
    "",                    // fornecedor
    "",                    // nota_fiscal
    "",                    // garantia_ate
    ativo.observacoes,
    ativo.created_at,
    ativo.created_by,
    ativo.updated_at,
    ativo.updated_by,
    "",                    // deleted_at
    "",                    // deleted_by
  ];
}

// ─── Gravar em lotes ──────────────────────────────────────────────────────────
async function appendLote(sheets, sheetId, aba, rows) {
  if (rows.length === 0) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${aba}!A:U`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

async function appendAuditoria(sheets, sheetId, entries) {
  if (entries.length === 0) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "_AUDITORIA!A:N",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: entries },
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const sheets = await getSheetsClient();
  const timestamp = now();
  const log = {
    inicio: timestamp,
    importados: [],
    ignoradas: [],
    erros: [],
  };

  console.log("🚀 Iniciando importação...");
  console.log(`   Origem: ${SOURCE_SHEET_ID}`);
  console.log(`   Destino: ${SEC_SHEET_ID}`);
  console.log();

  // ── 1. Ler planilha de origem ────────────────────────────────────────────
  console.log("📖 Lendo planilha de origem...");
  const computadores = await lerAba(sheets, SOURCE_SHEET_ID, "Computadores!A1:U");
  const celulares    = await lerAba(sheets, SOURCE_SHEET_ID, "Celulares!A1:L");
  console.log(`   Computadores: ${computadores.length - 1} linhas`);
  console.log(`   Celulares: ${celulares.length - 1} linhas`);
  console.log();

  const ativos = [];

  // ── 2. Processar Computadores ────────────────────────────────────────────
  console.log("💻 Processando computadores...");
  // Parar antes da linha de legenda (linha ~562)
  const linhasComp = computadores.slice(1, 561);
  for (const row of linhasComp) {
    const ativo = transformarComputador(row, log);
    if (ativo) {
      ativos.push({ ...ativo, origem: "Computadores" });
    }
  }
  console.log(`   ✓ ${ativos.length} computadores válidos`);

  // ── 3. Processar Celulares ───────────────────────────────────────────────
  console.log("📱 Processando celulares...");
  const antes = ativos.length;

  // Seção 1: linhas 2-202 (índices 1-201 do array, considerando header em índice 0)
  for (const row of celulares.slice(1, 202)) {
    const ativo = transformarCelular(row, 1, log);
    if (ativo) ativos.push({ ...ativo, origem: "Celulares-S1" });
  }

  // Seção 2: linhas a partir da 204 (índice 203, pular cabeçalho da seção 2 em índice 202)
  for (const row of celulares.slice(204)) {
    const ativo = transformarCelular(row, 2, log);
    if (ativo) ativos.push({ ...ativo, origem: "Celulares-S2" });
  }

  console.log(`   ✓ ${ativos.length - antes} celulares válidos`);
  console.log();
  console.log(`📦 Total a importar: ${ativos.length} ativos`);
  console.log();

  // ── 4. Adicionar IDs e metadados ─────────────────────────────────────────
  console.log("🔑 Gerando IDs...");
  const snVistos = new Set();
  let duplicatasSkip = 0;

  const ativosFinais = [];
  for (const ativo of ativos) {
    // Verificar S/N duplicado
    if (ativo.numero_serie && snVistos.has(ativo.numero_serie)) {
      log.ignoradas.push(`S/N duplicado ignorado: '${ativo.numero_serie}' (${ativo.nome})`);
      duplicatasSkip++;
      continue;
    }
    if (ativo.numero_serie) {
      snVistos.add(ativo.numero_serie);
    }

    ativo.equipamento_id = generateId("EQP");
    ativo.created_at     = timestamp;
    ativo.created_by     = IMPORT_USER;
    ativo.updated_at     = timestamp;
    ativo.updated_by     = IMPORT_USER;
    ativosFinais.push(ativo);
  }

  console.log(`   ${duplicatasSkip} duplicatas de S/N removidas`);
  console.log(`   ✓ ${ativosFinais.length} ativos únicos`);
  console.log();

  // ── 5. Gravar em EQUIPAMENTOS em lotes de 50 ────────────────────────────
  console.log("📝 Gravando na aba EQUIPAMENTOS...");
  const LOTE = 50;
  let gravados = 0;

  for (let i = 0; i < ativosFinais.length; i += LOTE) {
    const lote = ativosFinais.slice(i, i + LOTE);
    const rows = lote.map(ativoToRow);
    await appendLote(sheets, SEC_SHEET_ID, "EQUIPAMENTOS", rows);
    gravados += lote.length;
    process.stdout.write(`   ${gravados}/${ativosFinais.length}\r`);
    // Pequena pausa para não exceder rate limit da API
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`   ✓ ${gravados} registros gravados           `);
  console.log();

  // ── 6. Gravar em _AUDITORIA em lotes de 50 ──────────────────────────────
  console.log("📋 Gravando trilha de auditoria...");
  const auditRows = ativosFinais.map(ativo => [
    generateAuditId(),
    timestamp,
    "EQUIPAMENTOS",
    ativo.equipamento_id,
    "CREATE",
    "",
    "",
    JSON.stringify({
      nome:         ativo.nome,
      tipo:         ativo.tipo,
      marca:        ativo.marca,
      numero_serie: ativo.numero_serie,
      status:       ativo.status,
    }),
    IMPORT_USER,
    "Sistema",
    "import",
    "",
    "",
    `Importado de: ${ativo.origem}`,
  ]);

  for (let i = 0; i < auditRows.length; i += LOTE) {
    const lote = auditRows.slice(i, i + LOTE);
    await appendAuditoria(sheets, SEC_SHEET_ID, lote);
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`   ✓ ${auditRows.length} entradas de auditoria gravadas`);
  console.log();

  // ── 7. Gerar log ─────────────────────────────────────────────────────────
  log.importados = ativosFinais.map(a => ({
    id:   a.equipamento_id,
    nome: a.nome,
    tipo: a.tipo,
    sn:   a.numero_serie,
    responsavel: a._responsavel_nome,
  }));

  const logPath = path.join(process.cwd(), "import-log.txt");
  const logContent = [
    `=== SEC Import Log ===`,
    `Data: ${timestamp}`,
    `Importados: ${ativosFinais.length}`,
    `Ignorados: ${log.ignoradas.length}`,
    `Duplicatas removidas: ${duplicatasSkip}`,
    ``,
    `--- IMPORTADOS (${log.importados.length}) ---`,
    ...log.importados.map(a => `${a.id} | ${a.nome} | ${a.tipo} | S/N: ${a.sn || "-"} | Responsável: ${a.responsavel || "-"}`),
    ``,
    `--- IGNORADOS (${log.ignoradas.length}) ---`,
    ...log.ignoradas,
    ``,
    `--- ERROS (${log.erros.length}) ---`,
    ...log.erros,
  ].join("\n");

  fs.writeFileSync(logPath, logContent, "utf-8");

  // ── 8. Resumo final ───────────────────────────────────────────────────────
  console.log("✅ Importação concluída!");
  console.log(`   Ativos importados:     ${ativosFinais.length}`);
  console.log(`   Linhas ignoradas:      ${log.ignoradas.length}`);
  console.log(`   Duplicatas removidas:  ${duplicatasSkip}`);
  console.log(`   Log salvo em:          import-log.txt`);
  console.log();
  console.log("⚠️  Próximos passos:");
  console.log("   1. Abrir a planilha SEC e verificar a aba EQUIPAMENTOS");
  console.log("   2. Conferir 10% dos registros manualmente");
  console.log("   3. Abrir import-log.txt e revisar as linhas ignoradas");
  console.log("   4. Adicionar o ID da planilha de origem ao .gitignore");
}

main().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
