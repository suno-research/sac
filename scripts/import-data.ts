import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const key = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function limparAba(sheetName: string) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`,
  });
  console.log(`🧹 ${sheetName}: dados antigos removidos`);
}

async function importCSV(sheetName: string, csvPath: string) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");
  const dataRows = lines.slice(1);

  const values = dataRows.map((line) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    return cols;
  });

  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: batch },
    });
    imported += batch.length;
    console.log(`  ${sheetName}: ${imported}/${values.length} importados...`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`✅ ${sheetName}: ${values.length} registros importados!`);
}

async function main() {
  console.log("🚀 Iniciando importação...\n");

  const funcionariosPath = path.join(process.cwd(), "scripts", "funcionarios_final.csv");
  const perfisPath = path.join(process.cwd(), "scripts", "perfis_import.csv");

  if (!fs.existsSync(funcionariosPath)) {
    console.error("❌ Arquivo funcionarios_final.csv não encontrado em scripts/");
    process.exit(1);
  }
  if (!fs.existsSync(perfisPath)) {
    console.error("❌ Arquivo perfis_import.csv não encontrado em scripts/");
    process.exit(1);
  }

  // 1. Limpar e reimportar funcionários
  await limparAba("funcionarios");
  await importCSV("funcionarios", funcionariosPath);

  // 2. Limpar e reimportar perfis
  await limparAba("perfis_padrao");
  await importCSV("perfis_padrao", perfisPath);

  console.log("\n🎉 Importação concluída!");
  console.log("  - 317 funcionários com cargo e área");
  console.log("  - 15 perfis padrão por área");
}

main().catch(console.error);
