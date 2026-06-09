import { NextResponse } from "next/server";
import { getSheetData, updateSheetRow } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { funcionarioId, tipo, status } = body;

    if (!funcionarioId || !tipo || !status) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const rows = await getSheetData("movimentacoes!A2:E");
    const rowIndex = rows.findIndex(
      (row) =>
        row[1] === funcionarioId &&
        row[2] === tipo &&
        row[4] === "em andamento"
    );

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    const row = rows[rowIndex];

    await updateSheetRow(`movimentacoes!A${sheetRow}:E${sheetRow}`, [
      row[0], row[1], row[2], row[3] || "", status,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao concluir movimentação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
