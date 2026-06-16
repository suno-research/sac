import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";
import { filterByFuncionarioScope } from "@/lib/governance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "user";
    const userEmail = session.user.email ?? "";

    const [offRows, funcRows] = await Promise.all([
      getSheetData("offboardings!A2:G"),
      getSheetData("funcionarios!A2:I"),
    ]);

    const funcionarios = funcRows.map((row) => ({
      id: row[0] || "",
      email: row[2] || "",
      gestorId: row[5] || undefined,
    }));

    const offboardings = offRows.map((row) => ({
      id: row[0] || "",
      funcionarioId: row[1] || "",
      dataDesligamento: row[2] || "",
      dataInicio: row[3] || "",
      dataConclusao: row[4] || undefined,
      status: row[5] || "",
      responsavelId: row[6] || "",
    }));

    const filtered = filterByFuncionarioScope(
      offboardings.filter((o) => o.id),
      funcionarios,
      role,
      userEmail
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Erro ao buscar offboardings:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ti") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const dataInicio = body.dataInicio || new Date().toISOString().split("T")[0];

    await appendSheetRow("offboardings!A:G", [
      body.id,
      body.funcionarioId,
      body.dataDesligamento,
      dataInicio,
      body.dataConclusao || "",
      body.status,
      body.responsavelId || session.user?.email || "",
    ]);

    const movId = `mov${Date.now()}`;
    await appendSheetRow("movimentacoes!A:E", [
      movId,
      body.funcionarioId,
      "offboarding",
      dataInicio,
      "em andamento",
    ]);

    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error("Erro ao salvar offboarding:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ti") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

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
