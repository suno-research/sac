import * as dotenv from "dotenv";
import { google } from "googleapis";
import { ferramentas } from "./ferramentas-passbolt-data";

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
  console.log("🚀 Iniciando importação de ferramentas...\n");

  const rows = await getSheetData("ferramentas!A2:F");
  const nomesExistentes = new Set(
    rows.map((row) => normalizar(row[1] || "")).filter(Boolean)
  );

  let inseridas = 0;
  let puladas = 0;

  for (let index = 0; index < ferramentas.length; index++) {
    const { nome, categoria, tipo, url, descricao } = ferramentas[index];

    if (nomesExistentes.has(normalizar(nome))) {
      puladas++;
      continue;
    }

    const id = `f${Date.now()}${index}`;
    await appendSheetRowWithRetry("ferramentas!A:F", [id, nome, categoria, tipo, url, descricao]);
    nomesExistentes.add(normalizar(nome));
    inseridas++;

    if (inseridas % 10 === 0) {
      console.log(`  ${inseridas} inseridas, ${puladas} puladas...`);
    }

    await sleep(300);
  }

  console.log(`\n✅ Importação concluída!`);
  console.log(`   Inseridas: ${inseridas}`);
  console.log(`   Puladas (já existiam): ${puladas}`);
}

main().catch(console.error);
