import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { rowToTermo, termoToRow } from "@/lib/sec-termos";
import { logSECAudit } from "@/lib/sec-audit";
import type { Termo, UpdateTermoPayload } from "@/types/sec";

const EDITABLE_FIELDS: (keyof UpdateTermoPayload)[] = [
  "status",
  "data_assinatura",
  "assinado_por",
  "documento_url",
  "observacoes",
];

function secErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
    ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
    : fallback;
}

async function findTermoRow(id: string): Promise<{
  termo: Termo;
  rowIndex: number;
} | null> {
  const rows = await getSecSheetData("TERMOS!A2:S");
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return null;
  return { termo: rowToTermo(rows[rowIndex]), rowIndex };
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
    const found = await findTermoRow(id);

    if (!found || found.termo.deleted_at) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(found.termo);
  } catch (error) {
    console.error("Erro ao buscar termo:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao buscar termo.") },
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
    const body = (await request.json()) as UpdateTermoPayload;

    if (!body.status) {
      return NextResponse.json(
        { error: "Campo status é obrigatório" },
        { status: 400 }
      );
    }

    const found = await findTermoRow(id);
    if (!found || found.termo.deleted_at) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    const { termo: current, rowIndex } = found;
    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: Termo = { ...current };

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = current[field as keyof Termo];
        const oldStr = oldValue ?? "";
        const newStr = newValue ?? "";

        if (String(oldStr) !== String(newStr)) {
          await logSECAudit({
            entidade: "TERMOS",
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

    if (body.status === "assinado" && !updated.data_assinatura) {
      updated.data_assinatura = now.slice(0, 10);
    }

    if (body.status === "assinado" && !updated.assinado_por) {
      updated.assinado_por = email;
    }

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `TERMOS!A${sheetRow}:S${sheetRow}`,
      termoToRow(updated)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar termo:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao atualizar termo.") },
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
    const found = await findTermoRow(id);

    if (!found) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    const { termo: current, rowIndex } = found;

    if (current.deleted_at) {
      return NextResponse.json(
        { error: "Termo já foi removido" },
        { status: 400 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: Termo = {
      ...current,
      deleted_at: now,
      deleted_by: email,
      updated_at: now,
      updated_by: email,
    };

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `TERMOS!A${sheetRow}:S${sheetRow}`,
      termoToRow(updated)
    );

    await logSECAudit({
      entidade: "TERMOS",
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
    console.error("Erro ao remover termo:", error);
    return NextResponse.json(
      { error: secErrorMessage(error, "Erro ao remover termo.") },
      { status: 500 }
    );
  }
}
