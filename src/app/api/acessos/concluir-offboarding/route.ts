import { NextResponse } from "next/server";
import { getSheetData, updateSheetRow } from "@/lib/sheets";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { funcionarioId } = body;

    if (!funcionarioId) {
      return NextResponse.json({ error: "funcionarioId obrigatório" }, { status: 400 });
    }

    const rows = await getSheetData("acessos!A2:F");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row[1] === funcionarioId && row[3] === "Pendente remoção") {
        const sheetRow = i + 2;
        await updateSheetRow(`acessos!A${sheetRow}:F${sheetRow}`, [
          row[0], row[1], row[2], "Sem acesso", row[4] || "", row[5] || "",
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao concluir offboarding:", error);
    return NextResponse.json({ error: "Erro ao concluir" }, { status: 500 });
  }
}
