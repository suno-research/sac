import * as dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

const AREA_GESTOR_EMAIL: Record<string, string> = {
  TECNOLOGIA: "arie.perini@sunoresearch.com.br",
  CRM: "allan.rodrigues@suno.com.br",
  DADOS: "allan.rodrigues@suno.com.br",
  PRODUTOS: "arie.perini@sunoresearch.com.br",
  RH: "thiago.basile@suno.com.br",
  CONTEUDO: "bianca.brito@suno.com.br",
};

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

async function updateSheetRow(range: string, values: string[]): Promise<void> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
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

function alternarDominio(email: string): string | null {
  const lower = email.toLowerCase();
  if (lower.endsWith("@suno.com.br")) {
    return email.replace(/@suno\.com\.br$/i, "@sunoresearch.com.br");
  }
  if (lower.endsWith("@sunoresearch.com.br")) {
    return email.replace(/@sunoresearch\.com\.br$/i, "@suno.com.br");
  }
  return null;
}

function resolverEmailGestor(email: string, emailParaId: Map<string, string>): string | null {
  const tentativas = [email, alternarDominio(email)].filter(Boolean) as string[];
  for (const tentativa of tentativas) {
    const id = emailParaId.get(normalizar(tentativa));
    if (id) return id;
  }
  return null;
}

async function updateSheetRowWithRetry(range: string, values: string[]): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await updateSheetRow(range, values);
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
  console.log("🚀 Atualizando gestores por área...\n");

  const rows = await getSheetData("funcionarios!A2:I");

  const emailParaId = new Map<string, string>();
  for (const row of rows) {
    if (row[0] && row[2]) {
      emailParaId.set(normalizar(row[2]), row[0]);
    }
  }

  const areaParaGestorId = new Map<string, string>();
  let naoEncontrados = 0;

  for (const [area, emailGestor] of Object.entries(AREA_GESTOR_EMAIL)) {
    const gestorId = resolverEmailGestor(emailGestor, emailParaId);
    if (!gestorId) {
      console.log(`gestor não encontrado: ${emailGestor}`);
      naoEncontrados++;
      continue;
    }
    areaParaGestorId.set(area, gestorId);
    console.log(`✓ ${area} → ${emailGestor} (${gestorId})`);
  }

  let atualizados = 0;
  let ignoradosJaTinhamGestor = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = row[0] || "";
    const area = (row[4] || "").trim().toUpperCase();
    const gestorIdAtual = (row[5] || "").trim();
    const status = (row[6] || "").trim();

    if (!id || status !== "Ativo") continue;

    const gestorIdArea = areaParaGestorId.get(area);
    if (!gestorIdArea) continue;

    if (gestorIdAtual) {
      ignoradosJaTinhamGestor++;
      continue;
    }

    if (id === gestorIdArea) continue;

    const sheetRow = i + 2;
    await updateSheetRowWithRetry(`funcionarios!A${sheetRow}:I${sheetRow}`, [
      row[0] || "",
      row[1] || "",
      row[2] || "",
      row[3] || "",
      row[4] || "",
      gestorIdArea,
      row[6] || "Ativo",
      row[7] || "",
      row[8] || "",
    ]);

    atualizados++;
    if (atualizados % 20 === 0) {
      console.log(`  ${atualizados} atualizados...`);
    }

    await sleep(150);
  }

  console.log(`\n✅ Concluído!`);
  console.log(`   Total atualizados: ${atualizados}`);
  console.log(`   Ignorados (já tinham gestor): ${ignoradosJaTinhamGestor}`);
  console.log(`   Não encontrados: ${naoEncontrados}`);
}

main().catch(console.error);
