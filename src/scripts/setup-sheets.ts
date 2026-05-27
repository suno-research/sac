import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

async function setupSheets() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const abas = ["funcionarios", "ferramentas", "acessos", "perfis_padrao", "offboardings", "movimentacoes"];

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

  const requests = abas
    .filter((aba) => !existingSheets.includes(aba))
    .map((aba) => ({
      addSheet: { properties: { title: aba } },
    }));

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log(
      "Abas criadas:",
      requests.map((r) => r.addSheet.properties?.title)
    );
  }

  const headers: Record<string, string[]> = {
    funcionarios: [
      "id",
      "nome",
      "email",
      "cargo",
      "area",
      "gestorId",
      "status",
      "dataEntrada",
      "dataDesligamento",
    ],
    ferramentas: ["id", "nome", "categoria", "tipo", "url", "descricao"],
    acessos: ["id", "funcionarioId", "ferramentaId", "status", "dataConcessao", "concedidoPor"],
    perfis_padrao: ["id", "cargo", "area", "ferramentaIds", "descricao"],
    offboardings: [
      "id",
      "funcionarioId",
      "dataDesligamento",
      "dataInicio",
      "dataConclusao",
      "status",
      "responsavelId",
    ],
    movimentacoes: ["id", "funcionarioId", "tipo", "data", "status"],
  };

  for (const [aba, cols] of Object.entries(headers)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${aba}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [cols] },
    });
    console.log(`Headers da aba ${aba} configurados`);
  }

  console.log("Setup concluído!");
}

setupSheets().catch(console.error);
