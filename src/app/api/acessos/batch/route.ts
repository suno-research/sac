import { NextResponse } from "next/server";
import { appendSheetRow } from "@/lib/sheets";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const concedidoPor = session?.user?.email || "sistema";

    const body = await request.json();
    const { funcionarioId, ferramentaIds } = body;

    if (!funcionarioId || !Array.isArray(ferramentaIds)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const dataConcessao = new Date().toISOString().split("T")[0];

    for (const ferramentaId of ferramentaIds) {
      const id = `ac${Date.now()}-${ferramentaId}`;
      await appendSheetRow("acessos!A:F", [
        id, funcionarioId, ferramentaId, "Ativo", dataConcessao, concedidoPor,
      ]);
    }

    const movId = `mov${Date.now()}`;
    await appendSheetRow("movimentacoes!A:E", [
      movId, funcionarioId, "onboarding", dataConcessao, "concluido",
    ]);

    return NextResponse.json({ success: true, acessosCriados: ferramentaIds.length });
  } catch (error) {
    console.error("Erro ao salvar acessos:", error);
    return NextResponse.json({ error: "Erro ao salvar acessos" }, { status: 500 });
  }
}
