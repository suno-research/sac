import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const rows = await getSheetData("acessos!A2:F");
    const acessos = rows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      ferramentaId: row[2] || "",
      status: row[3] || "",
      dataConcessao: row[4] || "",
      concedidoPor: row[5] || "",
    }));
    return NextResponse.json(acessos.filter((a) => a.id));
  } catch (error) {
    console.error("Erro ao buscar acessos:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (session?.user?.role !== "ti") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const concedidoPor = session?.user?.email || "sistema";
    const body = await request.json();
    const { funcionarioId, ferramentaId } = body;

    if (!funcionarioId || !ferramentaId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const id = `ac${Date.now()}`;
    const dataConcessao = new Date().toISOString().split("T")[0];

    await appendSheetRow("acessos!A:F", [
      id, funcionarioId, ferramentaId, "Ativo", dataConcessao, concedidoPor,
    ]);

    return NextResponse.json({ id, funcionarioId, ferramentaId, status: "Ativo", dataConcessao, concedidoPor });
  } catch (error) {
    console.error("Erro ao criar acesso:", error);
    return NextResponse.json({ error: "Erro ao criar acesso" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession();
  if (session?.user?.role !== "ti") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 });
    }

    const rows = await getSheetData("acessos!A2:F");
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });
    }

    const sheetRow = rowIndex + 2;
    await updateSheetRow(`acessos!A${sheetRow}:F${sheetRow}`, ["", "", "", "", "", ""]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover acesso:", error);
    return NextResponse.json({ error: "Erro ao remover acesso" }, { status: 500 });
  }
}
