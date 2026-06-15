import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { google } from "googleapis";

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

async function getSheetData(range: string): Promise<string[][]> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (response.data.values as string[][]) || [];
}

async function appendSheetRow(range: string, values: string[]): Promise<void> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

function normalizar(str: string): string {
  return str.trim().toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCSVLine(line: string): string[] {
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
}

async function appendSheetRowWithRetry(range: string, values: string[]): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await appendSheetRow(range, values);
      return;
    } catch (error: unknown) {
      const status = (error as { code?: number; status?: number })?.code
        ?? (error as { status?: number })?.status;
      if (status === 429 && attempt < 4) {
        console.log("  ⏳ Rate limit atingido, aguardando 65s...");
        await sleep(65000);
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  console.log("🚀 Iniciando importação de acessos Passbolt...\n");

  const csvPath = path.join(process.cwd(), "scripts", "passbolt-permissions.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo não encontrado: ${csvPath}`);
    process.exit(1);
  }

  const [funcRows, ferrRows, acessoRows] = await Promise.all([
    getSheetData("funcionarios!A2:C"),
    getSheetData("ferramentas!A2:B"),
    getSheetData("acessos!A2:F"),
  ]);

  const emailParaId = new Map<string, string>();
  for (const row of funcRows) {
    if (row[0] && row[2]) {
      emailParaId.set(normalizar(row[2]), row[0]);
    }
  }

  const nomeParaId = new Map<string, string>();
  for (const row of ferrRows) {
    if (row[0] && row[1]) {
      nomeParaId.set(normalizar(row[1]), row[0]);
    }
  }

  const acessosExistentes = new Set<string>();
  for (const row of acessoRows) {
    if (row[1] && row[2]) {
      acessosExistentes.add(`${row[1]}|${row[2]}`);
    }
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const allLines = content.trim().split(/\r?\n/);
  const headerCols = parseCSVLine(allLines[0]).map((h) => h.trim().toLowerCase());
  const usernameIdx = headerCols.indexOf("username");
  const nameIdx = headerCols.indexOf("name");

  if (usernameIdx === -1 || nameIdx === -1) {
    console.error("❌ CSV deve conter colunas 'username' e 'name'");
    process.exit(1);
  }

  const lines = allLines.slice(1);

  const dataHoje = new Date().toISOString().split("T")[0];

  let inseridos = 0;
  let ignoradosFuncionario = 0;
  let ignoradosFerramenta = 0;
  let ignoradosDuplicata = 0;

  for (let index = 0; index < lines.length; index++) {
    const cols = parseCSVLine(lines[index]);
    const email = cols[usernameIdx]?.trim();
    const ferramentaNome = cols[nameIdx]?.trim();

    if (!email || !ferramentaNome) continue;

    const funcionarioId = emailParaId.get(normalizar(email));
    if (!funcionarioId) {
      ignoradosFuncionario++;
      console.log(`funcionário não encontrado: ${email}`);
      continue;
    }

    const ferramentaId = nomeParaId.get(normalizar(ferramentaNome));
    if (!ferramentaId) {
      ignoradosFerramenta++;
      console.log(`ferramenta não encontrada: ${ferramentaNome}`);
      continue;
    }

    const chave = `${funcionarioId}|${ferramentaId}`;
    if (acessosExistentes.has(chave)) {
      ignoradosDuplicata++;
      console.log(`acesso já existe: ${email} → ${ferramentaNome}`);
      continue;
    }

    const id = `ac${Date.now()}${index}`;
    await appendSheetRowWithRetry("acessos!A:F", [
      id,
      funcionarioId,
      ferramentaId,
      "Ativo",
      dataHoje,
      "passbolt-import",
    ]);

    acessosExistentes.add(chave);
    inseridos++;

    if (inseridos % 50 === 0) {
      console.log(`  ${inseridos} inseridos...`);
    }

    await sleep(200);
  }

  console.log(`\n✅ Importação concluída!`);
  console.log(`   Total de linhas no CSV: ${lines.length}`);
  console.log(`   Inseridos com sucesso: ${inseridos}`);
  console.log(`   Ignorados (funcionário não encontrado): ${ignoradosFuncionario}`);
  console.log(`   Ignorados (ferramenta não encontrada): ${ignoradosFerramenta}`);
  console.log(`   Ignorados (acesso já existe): ${ignoradosDuplicata}`);
}

main().catch(console.error);
