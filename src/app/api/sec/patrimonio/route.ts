import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, appendSecSheetRow } from "@/lib/sec-sheets";
import {
  generatePatrimonioId,
  rowToPatrimonio,
  patrimonioToRow,
} from "@/lib/sec-patrimonio";
import { logSECAudit } from "@/lib/sec-audit";
import type { CreatePatrimonioPayload } from "@/types/sec";

function sheetErrorMessage(context: string): string {
  return (error: unknown) => {
    console.error(`Erro ${context}:`, error);
    return error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
      ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
      : `Erro ao ${context}. Verifique se a aba PATRIMONIO existe na planilha SEC.`;
  };
}

async function loadPatrimonios() {
  const rows = await getSecSheetData("PATRIMONIO!A2:P");
  return rows.map(rowToPatrimonio).filter((p) => p.patrimonio_id.trim() !== "");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const patrimonios = await loadPatrimonios();
    return NextResponse.json(patrimonios);
  } catch (error) {
    return NextResponse.json(
      { error: sheetErrorMessage("ao buscar patrimônio")(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as CreatePatrimonioPayload;
    const {
      equipamento_id,
      numero_patrimonio,
      status,
      data_tombamento,
      responsavel_tombamento,
    } = body;

    if (
      !equipamento_id?.trim() ||
      !numero_patrimonio?.trim() ||
      !status ||
      !data_tombamento ||
      !responsavel_tombamento?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: equipamento_id, numero_patrimonio, status, data_tombamento, responsavel_tombamento",
        },
        { status: 400 }
      );
    }

    const patrimonios = await loadPatrimonios();
    const numeroNorm = numero_patrimonio.trim();

    if (
      patrimonios.some(
        (p) => p.numero_patrimonio.toLowerCase() === numeroNorm.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "Número de patrimônio já cadastrado." },
        { status: 400 }
      );
    }

    const equipRows = await getSecSheetData("EQUIPAMENTOS!A2:A");
    const equipExists = equipRows.some((row) => row[0] === equipamento_id);
    if (!equipExists) {
      return NextResponse.json(
        { error: "Equipamento não encontrado." },
        { status: 400 }
      );
    }

    const patrimonioAtivo = patrimonios.find(
      (p) => p.equipamento_id === equipamento_id && p.status !== "baixado"
    );
    if (patrimonioAtivo) {
      return NextResponse.json(
        { error: "Este equipamento já possui um registro patrimonial ativo." },
        { status: 400 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();

    const novoPatrimonio = {
      patrimonio_id: generatePatrimonioId(),
      equipamento_id: equipamento_id.trim(),
      numero_patrimonio: numeroNorm,
      status,
      data_tombamento,
      responsavel_tombamento: responsavel_tombamento.trim(),
      data_baixa: body.data_baixa || undefined,
      motivo_baixa: body.motivo_baixa?.trim() || undefined,
      documento_referencia: body.documento_referencia?.trim() || undefined,
      valor_tombamento: body.valor_tombamento || undefined,
      depreciacao_anual_pct: body.depreciacao_anual_pct || undefined,
      observacoes: body.observacoes?.trim() || undefined,
      created_at: now,
      created_by: email,
      updated_at: now,
      updated_by: email,
    };

    await appendSecSheetRow("PATRIMONIO!A:P", patrimonioToRow(novoPatrimonio));

    await logSECAudit({
      entidade: "PATRIMONIO",
      entidade_id: novoPatrimonio.patrimonio_id,
      acao: "CREATE",
      valor_novo: JSON.stringify(novoPatrimonio),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(novoPatrimonio, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: sheetErrorMessage("ao criar patrimônio")(error) },
      { status: 500 }
    );
  }
}
