import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow } from "@/lib/sheets";

export async function GET() {
  try {
    const rows = await getSheetData("acessos!A2:F");
    const acessos = rows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      ferramentaId: row[2] || "",
      status: row[3] || "",
      dataConcessao: row[4] || undefined,
      concedidoPor: row[5] || undefined,
    }));
    return NextResponse.json(acessos);
  } catch (error) {
    console.error("Erro ao buscar acessos:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, funcionarioId, ferramentaId, status, dataConcessao, concedidoPor } = body;
    await appendSheetRow("acessos!A:F", [
      id,
      funcionarioId,
      ferramentaId,
      status,
      dataConcessao || "",
      concedidoPor || "",
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar acesso:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
