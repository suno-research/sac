import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData } from "@/lib/sec-sheets";
import { rowToAtivo } from "@/lib/sec-ativos";
import { rowToAlocacao } from "@/lib/sec-alocacoes";
import { rowToPatrimonio } from "@/lib/sec-patrimonio";
import { rowToItemEstoque } from "@/lib/sec-estoque";
import { gerarPendencias } from "@/lib/sec-pendencias";

function secErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
    ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
    : fallback;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [ativosRows, alocacoesRows, patrimonioRows, estoqueRows] =
      await Promise.all([
        getSecSheetData("EQUIPAMENTOS!A2:V"),
        getSecSheetData("ALOCACOES!A2:R"),
        getSecSheetData("PATRIMONIO!A2:P"),
        getSecSheetData("ESTOQUE!A2:N"),
      ]);

    const ativos = ativosRows
      .map(rowToAtivo)
      .filter((a) => a.equipamento_id.trim() !== "" && !a.deleted_at);

    const alocacoes = alocacoesRows
      .map(rowToAlocacao)
      .filter((a) => a.alocacao_id.trim() !== "" && !a.deleted_at);

    const patrimonios = patrimonioRows
      .map(rowToPatrimonio)
      .filter((p) => p.patrimonio_id.trim() !== "");

    const estoques = estoqueRows
      .map(rowToItemEstoque)
      .filter((e) => e.estoque_id.trim() !== "");

    const pendencias = gerarPendencias({
      ativos,
      alocacoes,
      patrimonios,
      estoques,
    });

    return NextResponse.json(pendencias);
  } catch (error) {
    console.error("Erro ao buscar pendências SEC:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao gerar pendências. Verifique as abas da planilha SEC."
        ),
      },
      { status: 500 }
    );
  }
}
