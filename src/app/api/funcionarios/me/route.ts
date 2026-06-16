import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSheetData } from "@/lib/sheets";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();
    const rows = await getSheetData("funcionarios!A2:I");
    const row = rows.find((r) => (r[2] || "").toLowerCase() === userEmail);

    if (!row) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: row[0] || "",
      nome: row[1] || "",
      email: row[2] || "",
      cargo: row[3] || "",
      area: row[4] || "",
      gestorId: row[5] ? row[5] : null,
      status: row[6] || "Ativo",
      dataEntrada: row[7] || "",
      dataDesligamento: row[8] || undefined,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
