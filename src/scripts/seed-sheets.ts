import { google } from "googleapis";
import * as dotenv from "dotenv";
import { funcionarios, ferramentas, acessos, perfisPadrao, movimentacoes } from "../lib/mock-data";

dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

async function seed() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const funcRows = funcionarios.map((f) => [
    f.id,
    f.nome,
    f.email,
    f.cargo,
    f.area,
    f.gestorId || "",
    f.status,
    f.dataEntrada,
    f.dataDesligamento || "",
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "funcionarios!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: funcRows },
  });
  console.log("Funcionários populados:", funcRows.length);

  const ferrRows = ferramentas.map((f) => [f.id, f.nome, f.categoria, f.tipo, f.url, f.descricao]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "ferramentas!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: ferrRows },
  });
  console.log("Ferramentas populadas:", ferrRows.length);

  const acessosRows = acessos.map((a) => [
    a.id,
    a.funcionarioId,
    a.ferramentaId,
    a.status,
    a.dataConcessao || "",
    a.concedidoPor || "",
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "acessos!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: acessosRows },
  });
  console.log("Acessos populados:", acessosRows.length);

  const perfisRows = perfisPadrao.map((p) => [
    p.id,
    p.cargo,
    p.area,
    p.ferramentaIds.join(","),
    p.descricao,
  ]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "perfis_padrao!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: perfisRows },
  });
  console.log("Perfis padrão populados:", perfisRows.length);

  const movRows = movimentacoes.map((m) => [m.id, m.funcionarioId, m.tipo, m.data, m.status]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "movimentacoes!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: movRows },
  });
  console.log("Movimentações populadas:", movRows.length);

  console.log("Seed concluído!");
}

seed().catch(console.error);
