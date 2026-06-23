import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, appendSecSheetRow } from "@/lib/sec-sheets";
import {
  generateTermoId,
  rowToTermo,
  termoToRow,
} from "@/lib/sec-termos";
import { logSECAudit } from "@/lib/sec-audit";
import type { CreateTermoPayload, Termo } from "@/types/sec";

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

    const rows = await getSecSheetData("TERMOS!A2:S");
    const termos = rows
      .map(rowToTermo)
      .filter((t) => t.termo_id.trim() !== "" && !t.deleted_at);

    return NextResponse.json(termos);
  } catch (error) {
    console.error("Erro ao buscar termos:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao buscar termos. Verifique se a aba TERMOS existe na planilha SEC."
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

    const body = (await request.json()) as CreateTermoPayload;
    const {
      alocacao_id,
      equipamento_id,
      funcionario_id,
      funcionario_nome,
      funcionario_email,
      data_emissao,
    } = body;

    if (
      !alocacao_id?.trim() ||
      !equipamento_id?.trim() ||
      !funcionario_id?.trim() ||
      !funcionario_nome?.trim() ||
      !funcionario_email?.trim() ||
      !data_emissao
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: alocacao_id, equipamento_id, funcionario_id, funcionario_nome, funcionario_email, data_emissao",
        },
        { status: 400 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();

    const novoTermo: Termo = {
      termo_id: generateTermoId(),
      alocacao_id: alocacao_id.trim(),
      equipamento_id: equipamento_id.trim(),
      funcionario_id: funcionario_id.trim(),
      funcionario_nome: funcionario_nome.trim(),
      funcionario_email: funcionario_email.trim(),
      status: body.status ?? "pendente",
      data_emissao,
      canal_assinatura: body.canal_assinatura?.trim() || "manual",
      documento_url: body.documento_url?.trim() || undefined,
      observacoes: body.observacoes?.trim() || undefined,
      created_at: now,
      created_by: email,
      updated_at: now,
      updated_by: email,
    };

    await appendSecSheetRow("TERMOS!A:S", termoToRow(novoTermo));

    await logSECAudit({
      entidade: "TERMOS",
      entidade_id: novoTermo.termo_id,
      acao: "CREATE",
      valor_novo: JSON.stringify(novoTermo),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(novoTermo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar termo:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao criar termo. Verifique se a aba TERMOS existe na planilha SEC."
        ),
      },
      { status: 500 }
    );
  }
}
