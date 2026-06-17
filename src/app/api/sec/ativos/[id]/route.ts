import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { rowToAtivo, ativoToRow } from "@/lib/sec-ativos";
import { logSECAudit } from "@/lib/sec-audit";
import type { Ativo, UpdateAtivoPayload } from "@/types/sec";

const EDITABLE_FIELDS: (keyof UpdateAtivoPayload)[] = [
  "nome",
  "tipo",
  "marca",
  "modelo",
  "numero_serie",
  "numero_patrimonio",
  "status",
  "localizacao_atual",
  "data_aquisicao",
  "valor_aquisicao",
  "fornecedor",
  "nota_fiscal",
  "garantia_ate",
  "observacoes",
];

async function findAtivoRow(id: string): Promise<{
  ativo: Ativo;
  rowIndex: number;
} | null> {
  const rows = await getSecSheetData("EQUIPAMENTOS!A2:U");
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return null;
  return { ativo: rowToAtivo(rows[rowIndex]), rowIndex };
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
    const found = await findAtivoRow(id);

    if (!found) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(found.ativo);
  } catch (error) {
    console.error("Erro ao buscar ativo:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao buscar ativo.";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const body = (await request.json()) as UpdateAtivoPayload;

    if (!body.status) {
      return NextResponse.json(
        { error: "Campo status é obrigatório" },
        { status: 400 }
      );
    }

    const found = await findAtivoRow(id);
    if (!found) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 });
    }

    const { ativo: current, rowIndex } = found;
    const email = session.user.email ?? "";
    const now = new Date().toISOString();

    const updated: Ativo = { ...current };

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = current[field as keyof Ativo];
        const oldStr = oldValue ?? "";
        const newStr = newValue ?? "";

        if (String(oldStr) !== String(newStr)) {
          await logSECAudit({
            entidade: "EQUIPAMENTOS",
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
          (updated as Record<string, unknown>)[field] = newValue;
        }
      }
    }

    updated.status = body.status;
    updated.updated_at = now;
    updated.updated_by = email;

    if (body.status === "descartado" && current.status !== "descartado") {
      updated.deleted_at = now;
      updated.deleted_by = email;
    } else if (body.status !== "descartado" && current.status === "descartado") {
      delete updated.deleted_at;
      delete updated.deleted_by;
    }

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `EQUIPAMENTOS!A${sheetRow}:U${sheetRow}`,
      ativoToRow(updated)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar ativo:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao atualizar ativo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
