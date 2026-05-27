import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("movimentacoes!A2:E");
    const movimentacoes = rows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      tipo: row[2] || "",
      data: row[3] || "",
      status: row[4] || "",
    }));
    return NextResponse.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
