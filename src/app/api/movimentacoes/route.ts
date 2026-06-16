import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSheetData } from "@/lib/sheets";
import { filterByFuncionarioScope } from "@/lib/governance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "user";
    const userEmail = session.user.email ?? "";

    const [movRows, funcRows] = await Promise.all([
      getSheetData("movimentacoes!A2:E"),
      getSheetData("funcionarios!A2:I"),
    ]);

    const funcionarios = funcRows.map((row) => ({
      id: row[0] || "",
      email: row[2] || "",
      gestorId: row[5] || undefined,
    }));

    const movimentacoes = movRows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      tipo: row[2] || "",
      data: row[3] || "",
      status: row[4] || "",
    }));

    const filtered = filterByFuncionarioScope(movimentacoes, funcionarios, role, userEmail);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
