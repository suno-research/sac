import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";

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
    return NextResponse.json(offboardings.filter((o) => o.id));
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
      body.responsavelId || "",
    ]);
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error("Erro ao salvar offboarding:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, dataConclusao } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const rows = await getSheetData("offboardings!A2:G");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Offboarding não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    const current = rows[rowIndex];
    await updateSheetRow(`offboardings!A${sheetRow}:G${sheetRow}`, [
      current[0],
      current[1],
      current[2],
      current[3],
      dataConclusao || current[4] || "",
      status,
      current[6] || "",
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar offboarding:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
