import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("ferramentas!A2:F");
    const ferramentas = rows.map((row) => ({
      id: row[0] || "",
      nome: row[1] || "",
      categoria: row[2] || "",
      tipo: row[3] || "",
      url: row[4] || "",
      descricao: row[5] || "",
    }));
    return NextResponse.json(ferramentas);
  } catch (error) {
    console.error("Erro ao buscar ferramentas:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
