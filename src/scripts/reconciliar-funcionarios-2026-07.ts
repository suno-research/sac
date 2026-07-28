/**
 * Reconciliação pontual da aba `funcionarios` do SAC contra a
 * RELACAO_GERAL_DE_FUNCIONARIOS_GRUPO_SUNO (julho/2026).
 *
 * - Adiciona 12 colaboradores ausentes no SAC.
 * - Marca 5 colaboradores como "Desligado" (soft delete) por não constarem
 *   mais na relação oficial de RH.
 * - Não mexe nos 7 registros incompletos/freelancer sinalizados em PENDENCIAS.
 *
 * Uso:
 *   npx tsx src/scripts/reconciliar-funcionarios-2026-07.ts --dry-run
 *   npx tsx src/scripts/reconciliar-funcionarios-2026-07.ts
 */

import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;
const DRY_RUN = process.argv.includes("--dry-run");
const HOJE = new Date().toISOString().split("T")[0];
const RESPONSAVEL = "daniel.lopes@suno.com.br";

// Troque para "MIDIAS" se a decisão for criar o novo perfil padrão em vez de
// mapear para RESEARCH.
const AREA_MIDIAS = "RESEARCH";

function getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// --- 1. Colaboradores a ADICIONAR --------------------------------------
// email: "" significa que não foi possível confirmar — preencher antes do
// dry-run virar execução real, ou deixar em branco e completar depois.
const PARA_ADICIONAR = [
  { nome: "Arthur Bonifacio Merlini de Souza", email: "arthur.bonifacio@elevenresearch.com", cargo: "Analista CNPI 1", area: AREA_MIDIAS, dataEntrada: "2026-01-13" },
  { nome: "Caio Jose Ferreira Borges", email: "caio.borges@elevenresearch.com", cargo: "Analista CNPI 1", area: AREA_MIDIAS, dataEntrada: "2025-01-02" },
  { nome: "Juliana Bouth Marques", email: "juliana.bouth@elevenfinancial.com", cargo: "Analista de Risco Bancário", area: AREA_MIDIAS, dataEntrada: "" },
  { nome: "Leonardo de Sousa Verissimo", email: "leonardo.verissimo@elevenresearch.com", cargo: "Analista CNPI 3", area: AREA_MIDIAS, dataEntrada: "" },
  { nome: "Otavio Silva Guisard Faria", email: "otavio.faria@elevenresearch.com", cargo: "Especialista em Renda Fixa", area: AREA_MIDIAS, dataEntrada: "" },
  { nome: "Rafael Lopes de Siqueira", email: "rafael.siqueira@elevenresearch.com", cargo: "Estagiário", area: AREA_MIDIAS, dataEntrada: "" },
  { nome: "Valeria de Fatima Mansur Ferreira", email: "valeria.mansur@elevenfinancial.com", cargo: "Analista de Risco Bancário", area: AREA_MIDIAS, dataEntrada: "" },
  { nome: "Lucas Baccarat Carneiro da Cunha Bernardino da Silva", email: "", cargo: "Coordenador Comercial", area: "COMERCIAL", dataEntrada: "" }, // email a confirmar com TI
  { nome: "Artur Gomes Vieira Lins", email: "", cargo: "Sales Development Representative", area: "COMERCIAL", dataEntrada: "" }, // email a confirmar com TI
  { nome: "Victor Milhomens Wanderley Pessoa", email: "", cargo: "Especialista Comercial", area: AREA_MIDIAS, dataEntrada: "" }, // email a confirmar com TI
  { nome: "Maria Eduarda Santana Oliveira", email: "", cargo: "Aprendiz", area: "COMERCIAL", dataEntrada: "" }, // email a confirmar com TI
  // Lorenzo Figueiredo já tem um cadastro incompleto no SAC
  // (id u1781550160258, "Novo colabordor Lorenzo Figueiredo Carvalho da Silva").
  // Preferível: completar aquele registro em vez de criar um novo.
  // Deixado de fora deste array de propósito — ver seção de PENDÊNCIAS.
];

// --- 2. Colaboradores a marcar como DESLIGADO ---------------------------
const PARA_DESLIGAR = [
  { id: "u030", nome: "Bianca Pocai" },
  { id: "u100", nome: "Felipe Areia" },
  { id: "u181", nome: "Kauê Del Ponte" },
  { id: "u199", nome: "Lucas Rocha" },
  { id: "u246", nome: "Paulo Peixoto" },
];

async function main() {
  if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error("❌ GOOGLE_SHEETS_ID e GOOGLE_SERVICE_ACCOUNT_KEY são obrigatórios no .env.local");
    process.exit(1);
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Leitura única, consolidada
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: ["funcionarios!A2:I"],
  });
  const rows = data.valueRanges?.[0].values ?? [];

  console.log(`Planilha: ${rows.length} linhas em funcionarios!A2:I`);
  console.log(`Área Eleven/Mídias mapeada para: ${AREA_MIDIAS}`);
  console.log(`Responsável (auditoria): ${RESPONSAVEL}`);
  console.log("");

  // --- Desligamentos: montar batchUpdate localizando a linha de cada id ---
  const updateData: { range: string; values: string[][] }[] = [];
  for (const alvo of PARA_DESLIGAR) {
    const idx = rows.findIndex((r) => r[0] === alvo.id);
    if (idx === -1) {
      console.warn(`⚠️  ID ${alvo.id} (${alvo.nome}) não encontrado na planilha — pulando.`);
      continue;
    }
    const row = rows[idx];
    const sheetRow = idx + 2; // +1 header, +1 index-base
    updateData.push({
      range: `funcionarios!A${sheetRow}:I${sheetRow}`,
      values: [[
        row[0], row[1], row[2], row[3], row[4], row[5] || "",
        "Desligado", row[7] || "", HOJE,
      ]],
    });
    console.log(`→ Desligar ${alvo.id} (${row[1]}), dataDesligamento=${HOJE}`);
  }

  // --- Inclusões: gerar id no mesmo formato usado pela API (u + timestamp) ---
  const novasLinhas = PARA_ADICIONAR.map((c, i) => {
    const id = `u${Date.now() + i}`; // +i evita ids duplicados no mesmo batch
    console.log(`→ Adicionar ${id} (${c.nome}) | ${c.cargo} | ${c.area}${c.email ? ` | ${c.email}` : " | email pendente"}`);
    return [id, c.nome, c.email, c.cargo, c.area, "", "Ativo", c.dataEntrada || HOJE, ""];
  });

  if (DRY_RUN) {
    console.log(`\n--dry-run: nenhuma escrita foi feita.`);
    console.log(`Resumo: ${updateData.length} desligamento(s), ${novasLinhas.length} inclusão(ões).`);
    return;
  }

  if (updateData.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: updateData },
    });
  }

  if (novasLinhas.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "funcionarios!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: novasLinhas },
    });
  }

  console.log(`\n✅ Concluído: ${updateData.length} desligamento(s), ${novasLinhas.length} inclusão(ões).`);
  console.log("Lembrete: rodar auditoria/offboarding pelo fluxo normal do SAC para os desligados,");
  console.log("para que 'acessos', 'offboardings' e 'movimentacoes' fiquem consistentes.");
}

main().catch((err) => {
  console.error("Erro na reconciliação:", err);
  process.exit(1);
});
