import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, appendSecSheetRow } from "@/lib/sec-sheets";
import {
  alocacaoToRow,
  alocacoesAtivasDoEquipamento,
  generateAlocacaoId,
  rowToAlocacao,
} from "@/lib/sec-alocacoes";
import { logSECAudit } from "@/lib/sec-audit";
import type { Alocacao, CreateAlocacaoPayload } from "@/types/sec";

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

    const rows = await getSecSheetData("ALOCACOES!A2:R");
    const alocacoes = rows
      .map(rowToAlocacao)
      .filter(
        (a) => a.alocacao_id.trim() !== "" && !a.deleted_at
      );

    return NextResponse.json(alocacoes);
  } catch (error) {
    console.error("Erro ao buscar alocações:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao buscar alocações. Verifique se a aba ALOCACOES existe na planilha SEC."
        ),
      },
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

    const body = (await request.json()) as CreateAlocacaoPayload;
    const {
      equipamento_id,
      funcionario_id,
      funcionario_email,
      funcionario_nome,
      data_alocacao,
    } = body;

    if (
      !equipamento_id?.trim() ||
      !funcionario_id?.trim() ||
      !funcionario_email?.trim() ||
      !funcionario_nome?.trim() ||
      !data_alocacao
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: equipamento_id, funcionario_id, funcionario_email, funcionario_nome, data_alocacao",
        },
        { status: 400 }
      );
    }

    const rows = await getSecSheetData("ALOCACOES!A2:R");
    const existentes = rows
      .map(rowToAlocacao)
      .filter((a) => a.alocacao_id.trim() !== "" && !a.deleted_at);

    const ativas = alocacoesAtivasDoEquipamento(
      existentes,
      equipamento_id.trim()
    );
    if (ativas.length > 0) {
      return NextResponse.json(
        {
          error: "Este equipamento já possui uma alocação ativa.",
          alocacao_id: ativas[0].alocacao_id,
        },
        { status: 409 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();

    const novaAlocacao: Alocacao = {
      alocacao_id: generateAlocacaoId(),
      equipamento_id: equipamento_id.trim(),
      funcionario_id: funcionario_id.trim(),
      funcionario_email: funcionario_email.trim(),
      funcionario_nome: funcionario_nome.trim(),
      status: body.status ?? "ativa",
      data_alocacao,
      data_devolucao_prevista: body.data_devolucao_prevista || undefined,
      termo_id: body.termo_id?.trim() || undefined,
      observacoes: body.observacoes?.trim() || undefined,
      created_at: now,
      created_by: email,
      updated_at: now,
      updated_by: email,
    };

    await appendSecSheetRow("ALOCACOES!A:R", alocacaoToRow(novaAlocacao));

    await logSECAudit({
      entidade: "ALOCACOES",
      entidade_id: novaAlocacao.alocacao_id,
      acao: "CREATE",
      valor_novo: JSON.stringify(novaAlocacao),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(novaAlocacao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar alocação:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao criar alocação. Verifique se a aba ALOCACOES existe na planilha SEC."
        ),
      },
      { status: 500 }
    );
  }
}
