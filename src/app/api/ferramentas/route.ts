import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, categoria, tipo, url, descricao } = body;

    if (!nome || !categoria || !tipo || !url) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const id = `f${Date.now()}`;

    await appendSheetRow("ferramentas!A:F", [
      id, nome, categoria, tipo, url, descricao || "",
    ]);

    return NextResponse.json({ id, nome, categoria, tipo, url, descricao });
  } catch (error) {
    console.error("Erro ao criar ferramenta:", error);
    return NextResponse.json({ error: "Erro ao criar ferramenta" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nome, categoria, tipo, url, descricao } = body;

    if (!id || !nome || !categoria || !tipo || !url) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const rows = await getSheetData("ferramentas!A2:F");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Ferramenta não encontrada" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    await updateSheetRow(`ferramentas!A${sheetRow}:F${sheetRow}`, [
      id, nome, categoria, tipo, url, descricao || "",
    ]);

    return NextResponse.json({ id, nome, categoria, tipo, url, descricao });
  } catch (error) {
    console.error("Erro ao atualizar ferramenta:", error);
    return NextResponse.json({ error: "Erro ao atualizar ferramenta" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 });
    }

    const rows = await getSheetData("ferramentas!A2:F");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Ferramenta não encontrada" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    await updateSheetRow(`ferramentas!A${sheetRow}:F${sheetRow}`, [
      "", "", "", "", "", "",
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir ferramenta:", error);
    return NextResponse.json({ error: "Erro ao excluir ferramenta" }, { status: 500 });
  }
}
