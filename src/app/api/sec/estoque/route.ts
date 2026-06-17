import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, appendSecSheetRow } from "@/lib/sec-sheets";
import {
  generateEstoqueId,
  rowToItemEstoque,
  itemEstoqueToRow,
} from "@/lib/sec-estoque";
import { logSECAudit } from "@/lib/sec-audit";
import type { CreateEstoquePayload } from "@/types/sec";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const rows = await getSecSheetData("ESTOQUE!A2:N");
    const itens = rows
      .map(rowToItemEstoque)
      .filter((i) => i.estoque_id.trim() !== "");

    return NextResponse.json(itens);
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao buscar estoque. Verifique se a aba ESTOQUE existe na planilha SEC.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const body = (await request.json()) as CreateEstoquePayload;
    const {
      equipamento_id,
      descricao,
      quantidade_total,
      quantidade_disponivel,
      unidade,
    } = body;

    if (
      !equipamento_id?.trim() ||
      !descricao?.trim() ||
      quantidade_total === undefined ||
      quantidade_disponivel === undefined ||
      !unidade
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: equipamento_id, descricao, quantidade_total, quantidade_disponivel, unidade",
        },
        { status: 400 }
      );
    }

    if (quantidade_total < 0 || quantidade_disponivel < 0) {
      return NextResponse.json(
        { error: "Quantidades não podem ser negativas." },
        { status: 400 }
      );
    }

    if (quantidade_disponivel > quantidade_total) {
      return NextResponse.json(
        { error: "Quantidade disponível não pode ser maior que o total." },
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

    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const quantidade_alocada = quantidade_total - quantidade_disponivel;

    const novoItem = {
      estoque_id: generateEstoqueId(),
      equipamento_id: equipamento_id.trim(),
      descricao: descricao.trim(),
      quantidade_total,
      quantidade_disponivel,
      quantidade_alocada,
      unidade,
      localizacao: body.localizacao?.trim() || undefined,
      estoque_minimo: body.estoque_minimo,
      observacoes: body.observacoes?.trim() || undefined,
      created_at: now,
      created_by: email,
      updated_at: now,
      updated_by: email,
    };

    await appendSecSheetRow("ESTOQUE!A:N", itemEstoqueToRow(novoItem));

    await logSECAudit({
      entidade: "ESTOQUE",
      entidade_id: novoItem.estoque_id,
      acao: "CREATE",
      valor_novo: JSON.stringify(novoItem),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(novoItem, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item de estoque:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao criar item de estoque.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
