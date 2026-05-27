import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("perfis_padrao!A2:E");
    const perfis = rows.map((row) => ({
      id: row[0] || "",
      cargo: row[1] || "",
      area: row[2] || "",
      ferramentaIds: row[3] ? row[3].split(",").map((s: string) => s.trim()) : [],
      descricao: row[4] || "",
    }));
    return NextResponse.json(perfis.filter((p) => p.id));
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cargo, area, ferramentaIds, descricao } = body;

    if (!cargo || !area) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const id = `pp${Date.now()}`;

    await appendSheetRow("perfis_padrao!A:E", [
      id,
      cargo,
      area,
      Array.isArray(ferramentaIds) ? ferramentaIds.join(",") : "",
      descricao || "",
    ]);

    return NextResponse.json({ id, cargo, area, ferramentaIds: ferramentaIds || [], descricao });
  } catch (error) {
    console.error("Erro ao criar perfil:", error);
    return NextResponse.json({ error: "Erro ao criar perfil" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, cargo, area, ferramentaIds, descricao } = body;

    if (!id || !cargo || !area) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const rows = await getSheetData("perfis_padrao!A2:E");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    await updateSheetRow(`perfis_padrao!A${sheetRow}:E${sheetRow}`, [
      id,
      cargo,
      area,
      Array.isArray(ferramentaIds) ? ferramentaIds.join(",") : "",
      descricao || "",
    ]);

    return NextResponse.json({ id, cargo, area, ferramentaIds, descricao });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 });
    }

    const rows = await getSheetData("perfis_padrao!A2:E");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    await updateSheetRow(`perfis_padrao!A${sheetRow}:E${sheetRow}`, ["", "", "", "", ""]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir perfil:", error);
    return NextResponse.json({ error: "Erro ao excluir perfil" }, { status: 500 });
  }
}
