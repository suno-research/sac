import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData } from "@/lib/sec-sheets";
import { rowToPatrimonio } from "@/lib/sec-patrimonio";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ equipamentoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { equipamentoId } = await params;
    const rows = await getSecSheetData("PATRIMONIO!A2:P");
    const patrimonios = rows
      .map(rowToPatrimonio)
      .filter(
        (p) =>
          p.patrimonio_id.trim() !== "" && p.equipamento_id === equipamentoId
      );

    return NextResponse.json(patrimonios);
  } catch (error) {
    console.error("Erro ao buscar patrimônio por equipamento:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao buscar patrimônio do equipamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
