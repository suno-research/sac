import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { alocacaoToRow, rowToAlocacao } from "@/lib/sec-alocacoes";
import { logSECAudit } from "@/lib/sec-audit";
import type { Alocacao, UpdateAlocacaoPayload } from "@/types/sec";

const EDITABLE_FIELDS: (keyof UpdateAlocacaoPayload)[] = [
  "status",
  "data_devolucao_real",
  "motivo_devolucao",
  "observacoes",
];

function secErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
    ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
    : fallback;
}

async function findAlocacaoRow(id: string): Promise<{
  alocacao: Alocacao;
  rowIndex: number;
} | null> {
  const rows = await getSecSheetData("ALOCACOES!A2:R");
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return null;
  return { alocacao: rowToAlocacao(rows[rowIndex]), rowIndex };
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
    const found = await findAlocacaoRow(id);

    if (!found || found.alocacao.deleted_at) {
      return NextResponse.json(
        { error: "Alocação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(found.alocacao);
  } catch (error) {
    console.error("Erro ao buscar alocação:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao buscar alocação.") },
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
    const body = (await request.json()) as UpdateAlocacaoPayload;

    if (!body.status) {
      return NextResponse.json(
        { error: "Campo status é obrigatório" },
        { status: 400 }
      );
    }

    const found = await findAlocacaoRow(id);
    if (!found || found.alocacao.deleted_at) {
      return NextResponse.json(
        { error: "Alocação não encontrada" },
        { status: 404 }
      );
    }

    const { alocacao: current, rowIndex } = found;
    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: Alocacao = { ...current };

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = current[field as keyof Alocacao];
        const oldStr = oldValue ?? "";
        const newStr = newValue ?? "";

        if (String(oldStr) !== String(newStr)) {
          await logSECAudit({
            entidade: "ALOCACOES",
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
          delete (updated as Record<string, unknown>)[field];
        } else {
          (updated as Record<string, unknown>)[field] =
            typeof newValue === "string" ? newValue.trim() : newValue;
        }
      }
    }

    updated.status = body.status;
    updated.updated_at = now;
    updated.updated_by = email;

    if (body.status === "devolvida" && !updated.data_devolucao_real) {
      updated.data_devolucao_real = now.slice(0, 10);
    }

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `ALOCACOES!A${sheetRow}:R${sheetRow}`,
      alocacaoToRow(updated)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar alocação:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao atualizar alocação.") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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
    const found = await findAlocacaoRow(id);

    if (!found) {
      return NextResponse.json(
        { error: "Alocação não encontrada" },
        { status: 404 }
      );
    }

    const { alocacao: current, rowIndex } = found;

    if (current.deleted_at) {
      return NextResponse.json(
        { error: "Alocação já foi removida" },
        { status: 400 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: Alocacao = {
      ...current,
      deleted_at: now,
      deleted_by: email,
      updated_at: now,
      updated_by: email,
    };

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `ALOCACOES!A${sheetRow}:R${sheetRow}`,
      alocacaoToRow(updated)
    );

    await logSECAudit({
      entidade: "ALOCACOES",
      entidade_id: id,
      acao: "DELETE",
      valor_anterior: JSON.stringify(current),
      valor_novo: JSON.stringify(updated),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao remover alocação:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao remover alocação.") },
      { status: 500 }
    );
  }
}
