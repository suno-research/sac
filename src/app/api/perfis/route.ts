import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("perfis_padrao!A2:E");
    const perfis = rows.map((row) => ({
      id: row[0] || "",
      cargo: row[1] || "",
      area: row[2] || "",
      ferramentaIds: row[3] ? row[3].split(",").map((s) => s.trim()) : [],
      descricao: row[4] || "",
    }));
    return NextResponse.json(perfis);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
