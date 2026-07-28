/**
 * Abre o processo de offboarding (registros em `offboardings` e
 * `movimentacoes`, acessos Ativo -> Pendente remoção) para os 5
 * colaboradores já marcados como Desligado em funcionarios pelo script
 * de reconciliação anterior.
 *
 * Não muda `funcionarios` (já está correto) e não conclui o offboarding —
 * a remoção efetiva de cada acesso continua manual, pela tela
 * /offboarding/{id} do SAC.
 *
 * Uso:
 *   npx tsx src/scripts/iniciar-offboarding-2026-07.ts --dry-run
 *   npx tsx src/scripts/iniciar-offboarding-2026-07.ts
 */

import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;
const DRY_RUN = process.argv.includes("--dry-run");
const HOJE = new Date().toISOString().split("T")[0];
const RESPONSAVEL = "daniel.lopes@suno.com.br";

const DESLIGADOS = [
  { id: "u030", nome: "Bianca Pocai" },
  { id: "u100", nome: "Felipe Areia" },
  { id: "u181", nome: "Kauê Del Ponte" },
  { id: "u199", nome: "Lucas Rocha" },
  { id: "u246", nome: "Paulo Peixoto" },
];

function getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function main() {
  if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error("❌ GOOGLE_SHEETS_ID e GOOGLE_SERVICE_ACCOUNT_KEY são obrigatórios no .env.local");
    process.exit(1);
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Leitura única e consolidada de tudo que precisamos
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: ["funcionarios!A2:I", "acessos!A2:F", "offboardings!A2:G"],
  });
  const funcionarios = data.valueRanges?.[0].values ?? [];
  const acessos = data.valueRanges?.[1].values ?? [];
  const offboardingsExistentes = data.valueRanges?.[2].values ?? [];

  const novasOffboardings: string[][] = [];
  const novasMovimentacoes: string[][] = [];
  const acessosParaAtualizar: { range: string; values: string[][] }[] = [];

  DESLIGADOS.forEach((pessoa, i) => {
    const func = funcionarios.find((f) => f[0] === pessoa.id);
    if (!func) {
      console.warn(`⚠️  ${pessoa.id} (${pessoa.nome}) não encontrado em funcionarios — pulando.`);
      return;
    }
    if (func[6] !== "Desligado") {
      console.warn(`⚠️  ${pessoa.id} (${pessoa.nome}) está com status "${func[6]}", esperava "Desligado" — confira antes de rodar sem --dry-run.`);
    }

    const jaTemOffboarding = offboardingsExistentes.some((o) => o[1] === pessoa.id);
    if (jaTemOffboarding) {
      console.warn(`⚠️  ${pessoa.id} (${pessoa.nome}) já tem um registro em offboardings — pulando para não duplicar.`);
      return;
    }

    const offId = `off${Date.now() + i}`;
    const movId = `mov${Date.now() + i}`;

    novasOffboardings.push([
      offId, pessoa.id, HOJE, HOJE, "", "Em andamento", RESPONSAVEL,
    ]);
    novasMovimentacoes.push([
      movId, pessoa.id, "offboarding", HOJE, "em andamento",
    ]);

    let acessosAtualizados = 0;
    acessos.forEach((row, idx) => {
      if (row[1] === pessoa.id && row[3] === "Ativo") {
        const sheetRow = idx + 2;
        acessosParaAtualizar.push({
          range: `acessos!A${sheetRow}:F${sheetRow}`,
          values: [[row[0], row[1], row[2], "Pendente remoção", row[4] || "", row[5] || ""]],
        });
        acessosAtualizados++;
      }
    });

    console.log(`→ ${pessoa.id} (${pessoa.nome}): offboarding=${offId}, movimentacao=${movId}, ${acessosAtualizados} acesso(s) -> Pendente remoção`);
  });

  if (DRY_RUN) {
    console.log(`\n--dry-run: ${novasOffboardings.length} offboarding(s), ${novasMovimentacoes.length} movimentação(ões), ${acessosParaAtualizar.length} acesso(s) seriam alterados. Nada foi escrito.`);
    return;
  }

  if (acessosParaAtualizar.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: acessosParaAtualizar },
    });
  }
  if (novasOffboardings.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "offboardings!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: novasOffboardings },
    });
  }
  if (novasMovimentacoes.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "movimentacoes!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: novasMovimentacoes },
    });
  }

  console.log(`\n✅ Concluído: ${novasOffboardings.length} offboarding(s) aberto(s), ${acessosParaAtualizar.length} acesso(s) marcados como "Pendente remoção".`);
  console.log("Próximo passo: concluir cada offboarding manualmente em /offboarding/{id} no SAC.");
}

main().catch((err) => {
  console.error("Erro ao iniciar offboarding em lote:", err);
  process.exit(1);
});
