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
    const { id, novoStatus } = body;

    if (!id || !novoStatus) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const rows = await getSheetData("acessos!A2:F");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    const row = rows[rowIndex];

    await updateSheetRow(`acessos!A${sheetRow}:F${sheetRow}`, [
      row[0], row[1], row[2], novoStatus, row[4] || "", row[5] || "",
    ]);

    return NextResponse.json({ success: true, id, novoStatus });
  } catch (error) {
    console.error("Erro ao resolver acesso:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
