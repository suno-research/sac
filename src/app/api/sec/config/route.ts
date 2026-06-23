import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const sheetId = process.env.GOOGLE_SHEETS_SEC_ID ?? "";
    const sheetIdSuffix = sheetId.length >= 6 ? sheetId.slice(-6) : "";
    const sheetUrl = sheetId
      ? `https://docs.google.com/spreadsheets/d/${sheetId}`
      : "";

    return NextResponse.json({
      sheetIdSuffix,
      sheetUrl,
      webhookConfigured: Boolean(process.env.N8N_WEBHOOK_SECRET),
    });
  } catch (error) {
    console.error("Erro ao buscar config SEC:", error);
    return NextResponse.json(
      { error: "Erro ao carregar configurações." },
      { status: 500 }
    );
  }
}
