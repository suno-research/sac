import { NextResponse } from "next/server";
import { getSheetData, updateSheetRow } from "@/lib/sheets";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const rows = await getSheetData("funcionarios!A2:I");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    const current = rows[rowIndex];

    await updateSheetRow(`funcionarios!A${sheetRow}:I${sheetRow}`, [
      current[0],
      body.nome ?? current[1],
      body.email ?? current[2],
      body.cargo ?? current[3],
      body.area ?? current[4],
      body.gestorId ?? current[5] ?? "",
      body.status ?? current[6],
      current[7],
      body.dataDesligamento ?? current[8] ?? "",
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
