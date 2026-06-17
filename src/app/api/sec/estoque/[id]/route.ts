import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { rowToItemEstoque, itemEstoqueToRow } from "@/lib/sec-estoque";
import { logSECAudit } from "@/lib/sec-audit";
import type { ItemEstoque, UpdateEstoquePayload } from "@/types/sec";

const EDITABLE_FIELDS: (keyof UpdateEstoquePayload)[] = [
  "descricao",
  "quantidade_total",
  "quantidade_disponivel",
  "unidade",
  "localizacao",
  "estoque_minimo",
  "observacoes",
];

async function findEstoqueRow(id: string): Promise<{
  item: ItemEstoque;
  rowIndex: number;
} | null> {
  const rows = await getSecSheetData("ESTOQUE!A2:N");
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return null;
  return { item: rowToItemEstoque(rows[rowIndex]), rowIndex };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const found = await findEstoqueRow(id);

    if (!found) {
      return NextResponse.json(
        { error: "Item de estoque não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(found.item);
  } catch (error) {
    console.error("Erro ao buscar item de estoque:", error);
    return NextResponse.json(
      { error: "Erro ao buscar item de estoque." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateEstoquePayload;

    const found = await findEstoqueRow(id);
    if (!found) {
      return NextResponse.json(
        { error: "Item de estoque não encontrado" },
        { status: 404 }
      );
    }

    const { item: current, rowIndex } = found;
    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: ItemEstoque = { ...current };

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = current[field as keyof ItemEstoque];
        const oldStr = oldValue ?? "";
        const newStr = newValue ?? "";

        if (String(oldStr) !== String(newStr)) {
          await logSECAudit({
            entidade: "ESTOQUE",
            entidade_id: id,
            acao: "UPDATE",
            campo_alterado: field,
            valor_anterior: String(oldStr),
            valor_novo: String(newStr),
            usuario_email: email,
            usuario_nome: session.user.name ?? undefined,
            origem: "app",
          });
        }

        if (newValue === undefined || newValue === "") {
          if (field !== "descricao" && field !== "quantidade_total" && field !== "quantidade_disponivel" && field !== "unidade") {
            delete (updated as Record<string, unknown>)[field];
          }
        } else {
          (updated as Record<string, unknown>)[field] = newValue;
        }
      }
    }

    const total =
      body.quantidade_total !== undefined
        ? body.quantidade_total
        : updated.quantidade_total;
    const disponivel =
      body.quantidade_disponivel !== undefined
        ? body.quantidade_disponivel
        : updated.quantidade_disponivel;

    if (total < 0 || disponivel < 0) {
      return NextResponse.json(
        { error: "Quantidades não podem ser negativas." },
        { status: 400 }
      );
    }

    if (disponivel > total) {
      return NextResponse.json(
        { error: "Quantidade disponível não pode ser maior que o total." },
        { status: 400 }
      );
    }

    updated.quantidade_total = total;
    updated.quantidade_disponivel = disponivel;
    updated.quantidade_alocada = total - disponivel;
    updated.updated_at = now;
    updated.updated_by = email;

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `ESTOQUE!A${sheetRow}:N${sheetRow}`,
      itemEstoqueToRow(updated)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar estoque." },
      { status: 500 }
    );
  }
}
