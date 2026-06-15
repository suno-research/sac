import * as dotenv from "dotenv";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendWithRetry(range: string, values: string[]): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await appendSheetRow(range, values);
      return;
    } catch (error: unknown) {
      const status =
        (error as { code?: number })?.code ??
        (error as { status?: number })?.status;
      if (status === 429 && attempt < 4) {
        console.log("  ⏳ Rate limit, aguardando 65s...");
        await sleep(65000);
        continue;
      }
      throw error;
    }
  }
}

const novasFerramentas = [
  "AGF+", "ActiveCampaign Eleven", "AirFlow", "AirFlow Novo", "Airflow-v2",
  "Amazon Web Services", "Anthropic", "BTG", "Bannersnack", "Barrons / WSJ",
  "Bloomberg News", "Captions", "Certifiquei - Hotmart", "Chat GPT - SEO",
  "ChatGPT time FPeA - Licença Plus", "ChatGPT-4", "ClickSign", "CloudCheckr",
  "Copyscape", "Credencial Salesforce - STATUS INVEST", "Credencial Salesforce - SUNO",
  "Credencial Salesforce - SUNO ASSET", "Credencial Salesforce - SUNO CONSULTORIA",
  "Credencial Salesforce - SUNO MIDIAS", "Credencial Salesforce - SUNO RESEARCH",
  "Curso El Professor", "DevZapp", "Dino", "Easy-LMS (Suno Challenge)", "Economatica",
  "Eduzz", "Estadão", "Financial Times", "Finclass", "Folha de São Paulo",
  "GitHub - Vercel", "GitLab", "Gmail Suno", "Google Drive Backoffice",
  "Google RI Asset Automations", "Gorila", "Grafana - Eleven", "Gupy", "GuruFocus",
  "Hedra - Gravação IA", "Heroku", "Heygen - IA de Avatar Falante",
  "Hotmart Contato@suno", "Hotmart Cursos.01", "Hotmart Suno Noticias", "Hugging Face",
  "Infogram", "Instagram", "Keycloak Dev", "Keycloak Production",
  "Kommo - CRM Social Selling", "Krea", "Linkana SRM", "Make.com",
  "Market Makers - The Report", "Microsoft", "Microsoft 365", "Monday Compliance",
  "Morningstar", "NY Times", "New Relic statusinvest", "O Globo", "Office 365",
  "OneSignal", "OpusClip", "Outlook Status Invest", "PandaDoc",
  "Payments Dashboard Production", "Payments Dashboard Staging", "PerfomIt ASSET DADOS",
  "Power BI - AI", "Power BI - Asset", "Power BI - Consultoria",
  "Power BI - Consultoria Compass", "Power BI - Financeiro", "Power BI - Liderança Asset",
  "Power BI - Middle", "Power BI - Operacoes", "Power BI - Produtos",
  "Power BI - Sucesso do Cliente", "Power BI - Wealth", "RDS - production - fiis-lp",
  "RDS - production - fiis-wp", "RDS Suno Core Prod", "RDS Suno Minuto Reader",
  "RDS Suno Special Projects", "Refinitiv", "Registro.br grupo SUNO SA", "SYDLE ONE",
  "Salt Code - Ravena - Status Invest", "Screaming Frog", "Seeking Alpha", "Serasa",
  "Slack softwares", "Snowflake - SOFTWARES USER", "Societário Academy", "Spark (Admin)",
  "Spreed AI (Tiago Reis)", "Spreed AI (Vitor Lopes)", "Staage", "Staage Vinicius Daud",
  "Statista", "Status Invest", "Status Page suno", "Suno Core Grafana", "Suno Core Prod",
  "Suno Orbit API", "Suno-sqlserver (GCP)", "Supabase - Gorila",
  "Supabase - Gorila - Database", "Supabase Gorila", "Transkriptor", "Typebot", "Udemy",
  "VENDE-C", "VEO3 - Flow", "VIVO - Eleven", "VIVO - Eleven MVE",
  "VPN Forticlient fortigate", "Valor", "Valor Econômico", "Value Line", "Veja", "Vimeo",
  "Vimeo Billing", "Vindi", "WSJ", "WhitePress", "Wiki data team", "XP Investimentos",
  "Youtube SN", "Youtube Suno Consultoria", "Zoom", "Suno Backoffice (Dev Admin)",
  "Suno Backoffice (Dev Baroni)", "Keycloak Administration Console (Prod)",
  "WordPress Reader (Production)", "WordPress Reader (Staging)", "apple.com (Empresa)",
  "apple.com (Teste)", "apple.com (old)", "axur.com", "calendly.com",
  "Hubspot Assessoria (contato)", "Hubspot Onboarding Consultoria", "dash.cloudflare.com",
  "digitalocean.com", "figma.com", "insights.hotjar.com", "intranet staging",
  "microsoft authenticator", "myProfit", "myProfit - Paula", "nfe.io",
  "noreply | Consultoria", "scribd", "siteblindado.com", "sunocode - Supabase",
  "tomticket.com", "typeform.com", "ubuntu cockpit vpn", "upMiner", "yapay.com.br",
  "Área do Investidor - Suno",
];

async function main() {
  console.log("🚀 Iniciando importação de novas ferramentas...\n");

  const ferrRows = await getSheetData("ferramentas!A2:B");
  const existentes = new Set<string>();
  let maiorId = 519;

  for (const row of ferrRows) {
    if (row[1]) existentes.add(row[1].trim().toLowerCase());
    if (row[0]) {
      const num = parseInt(row[0].replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > maiorId) maiorId = num;
    }
  }

  console.log(`   Ferramentas existentes: ${existentes.size}`);
  console.log(`   Maior ID atual: f${maiorId}\n`);

  let inseridos = 0;
  let ignorados = 0;
  let proximoId = maiorId + 1;

  for (const nome of novasFerramentas) {
    if (existentes.has(nome.trim().toLowerCase())) {
      console.log(`⏭  Já existe: ${nome}`);
      ignorados++;
      continue;
    }

    const id = `f${String(proximoId).padStart(3, "0")}`;
    proximoId++;

    await appendWithRetry("ferramentas!A:F", [id, nome, "", "", "", ""]);
    existentes.add(nome.trim().toLowerCase());
    inseridos++;
    console.log(`✅ [${id}]: ${nome}`);
    await sleep(300);
  }

  console.log(`\n✅ Concluído! Inseridas: ${inseridos} | Ignoradas: ${ignorados}`);
}

main().catch(console.error);
