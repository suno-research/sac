import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("funcionarios!A2:I");
    const funcionarios = rows.map((row) => ({
      id: row[0] || "",
      nome: row[1] || "",
      email: row[2] || "",
      cargo: row[3] || "",
      area: row[4] || "",
      gestorId: row[5] ? row[5] : null,
      status: row[6] || "Ativo",
      dataEntrada: row[7] || "",
      dataDesligamento: row[8] || undefined,
    }));
    return NextResponse.json(funcionarios);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
