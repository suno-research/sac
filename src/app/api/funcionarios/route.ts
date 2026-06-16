import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSheetData, appendSheetRow } from "@/lib/sheets";
import { filterFuncionariosByRole } from "@/lib/governance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "user";
    const userEmail = session.user.email ?? "";

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

    const filtered = filterFuncionariosByRole(funcionarios, role, userEmail);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.role || session.user.role !== "ti") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nome, email, cargo, area, gestorId, dataEntrada } = body;

    if (!nome || !email || !cargo || !area || !dataEntrada) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const id = `u${Date.now()}`;
    const status = "Ativo";

    await appendSheetRow("funcionarios!A:I", [
      id, nome, email, cargo, area, gestorId || "", status, dataEntrada, "",
    ]);

    return NextResponse.json({ id, nome, email, cargo, area, gestorId, status, dataEntrada });
  } catch (error) {
    console.error("Erro ao criar funcionário:", error);
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 });
  }
}
