import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { rowToPatrimonio, patrimonioToRow } from "@/lib/sec-patrimonio";
import { logSECAudit } from "@/lib/sec-audit";
import type { Patrimonio, UpdatePatrimonioPayload } from "@/types/sec";

const EDITABLE_FIELDS: (keyof UpdatePatrimonioPayload)[] = [
  "numero_patrimonio",
  "status",
  "data_baixa",
  "motivo_baixa",
  "documento_referencia",
  "valor_tombamento",
  "depreciacao_anual_pct",
  "observacoes",
];

async function findPatrimonioRow(id: string): Promise<{
  patrimonio: Patrimonio;
  rowIndex: number;
} | null> {
  const rows = await getSecSheetData("PATRIMONIO!A2:P");
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex === -1) return null;
  return { patrimonio: rowToPatrimonio(rows[rowIndex]), rowIndex };
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
    const found = await findPatrimonioRow(id);

    if (!found) {
      return NextResponse.json(
        { error: "Patrimônio não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(found.patrimonio);
  } catch (error) {
    console.error("Erro ao buscar patrimônio:", error);
    return NextResponse.json({ error: "Erro ao buscar patrimônio." }, { status: 500 });
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
    const body = (await request.json()) as UpdatePatrimonioPayload;

    if (!body.status) {
      return NextResponse.json(
        { error: "Campo status é obrigatório" },
        { status: 400 }
      );
    }

    if (body.status === "baixado") {
      const dataBaixa = body.data_baixa;
      const motivoBaixa = body.motivo_baixa?.trim();
      if (!dataBaixa || !motivoBaixa) {
        return NextResponse.json(
          { error: "data_baixa e motivo_baixa são obrigatórios para baixa." },
          { status: 400 }
        );
      }
    }

    const found = await findPatrimonioRow(id);
    if (!found) {
      return NextResponse.json(
        { error: "Patrimônio não encontrado" },
        { status: 404 }
      );
    }

    const { patrimonio: current, rowIndex } = found;
    const email = session.user.email ?? "";
    const now = new Date().toISOString();
    const updated: Patrimonio = { ...current };

    if (
      body.numero_patrimonio &&
      body.numero_patrimonio.trim() !== current.numero_patrimonio
    ) {
      const rows = await getSecSheetData("PATRIMONIO!A2:P");
      const duplicado = rows.some(
        (row) =>
          row[0] !== id &&
          row[2]?.toLowerCase() === body.numero_patrimonio!.trim().toLowerCase()
      );
      if (duplicado) {
        return NextResponse.json(
          { error: "Número de patrimônio já cadastrado." },
          { status: 400 }
        );
      }
    }

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = current[field as keyof Patrimonio];
        const oldStr = oldValue ?? "";
        const newStr = newValue ?? "";

        if (String(oldStr) !== String(newStr)) {
          await logSECAudit({
            entidade: "PATRIMONIO",
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

    if (body.status === "baixado") {
      updated.data_baixa = body.data_baixa;
      updated.motivo_baixa = body.motivo_baixa?.trim();
    }

    const sheetRow = rowIndex + 2;
    await updateSecSheetRow(
      `PATRIMONIO!A${sheetRow}:P${sheetRow}`,
      patrimonioToRow(updated)
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar patrimônio:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar patrimônio." },
      { status: 500 }
    );
  }
}
