import { google } from "googleapis";
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

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Criar aba admins
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: "admins" }
          }
        }]
      }
    });
    console.log("✅ Aba 'admins' criada!");
  } catch {
    console.log("⚠️  Aba 'admins' já existe, continuando...");
  }

  // 2. Adicionar cabeçalho e admins
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "admins!A1:B1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["email", "role"]]
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "admins!A2:B4",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["daniel.lopes@suno.com.br", "ti"],
        ["marcel.freitas@suno.com.br", "ti"],
        ["millena.mayumi@suno.com.br", "ti"],
      ]
    }
  });

  console.log("✅ Admins cadastrados:");
  console.log("   - daniel.lopes@suno.com.br (ti)");
  console.log("   - marcel.freitas@suno.com.br (ti)");
  console.log("   - millena.mayumi@suno.com.br (ti)");
  console.log("\n🎉 Sessão 11 concluída! Roles agora gerenciados via Sheets.");
}

main().catch(console.error);
