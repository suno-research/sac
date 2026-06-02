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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const rows = await getSheetData("funcionarios!A2:I");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    const row = rows[rowIndex];

    await updateSheetRow(`funcionarios!A${sheetRow}:I${sheetRow}`, [
      row[0], row[1], row[2], row[3], row[4], row[5] || "", "Arquivado", row[7] || "", row[8] || "",
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao arquivar funcionário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
