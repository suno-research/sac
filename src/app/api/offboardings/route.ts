import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("offboardings!A2:G");
    const offboardings = rows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      dataDesligamento: row[2] || "",
      dataInicio: row[3] || "",
      dataConclusao: row[4] || undefined,
      status: row[5] || "",
      responsavelId: row[6] || "",
    }));
    return NextResponse.json(offboardings);
  } catch (error) {
    console.error("Erro ao buscar offboardings:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await appendSheetRow("offboardings!A:G", [
      body.id,
      body.funcionarioId,
      body.dataDesligamento,
      body.dataInicio,
      body.dataConclusao || "",
      body.status,
      body.responsavelId,
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar offboarding:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
