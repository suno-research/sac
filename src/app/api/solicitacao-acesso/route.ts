import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow } from "@/lib/sheets";

// Normaliza string para comparação
function normalizar(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

// Match fuzzy por tokens
function calcularScore(a: string, b: string): number {
  const tokensA = new Set(normalizar(a).split(" "));
  const tokensB = new Set(normalizar(b).split(" "));
  const intersec = [...tokensA].filter((t) => tokensB.has(t));
  return intersec.length;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailSolicitante, nomeFerramenta, dataEvento } = body;

    if (!emailSolicitante || !nomeFerramenta) {
      return NextResponse.json({ error: "emailSolicitante e nomeFerramenta são obrigatórios" }, { status: 400 });
    }

    const hoje = dataEvento || new Date().toISOString().split("T")[0];

    // Buscar dados
    const [funcRows, ferrRows, acessoRows] = await Promise.all([
      getSheetData("funcionarios!A2:I"),
      getSheetData("ferramentas!A2:F"),
      getSheetData("acessos!A2:F"),
    ]);

    // Buscar funcionário pelo email
    const funcRow = funcRows.find(
      (row) => row[2] && normalizar(row[2]) === normalizar(emailSolicitante)
    );

    if (!funcRow) {
      return NextResponse.json({
        error: `Funcionário com email "${emailSolicitante}" não encontrado`,
        emailSolicitante,
      }, { status: 404 });
    }

    const funcionarioId = funcRow[0];
    const funcionarioNome = funcRow[1];

    // Buscar ferramenta pelo nome (match fuzzy)
    let melhorScore = 0;
    let ferramentaEncontrada: string[] | null = null;

    for (const row of ferrRows) {
      if (!row[1]) continue;
      const score = calcularScore(nomeFerramenta, row[1]);
      if (score > melhorScore) {
        melhorScore = score;
        ferramentaEncontrada = row;
      }
    }

    if (!ferramentaEncontrada || melhorScore < 1) {
      return NextResponse.json({
        error: `Ferramenta "${nomeFerramenta}" não encontrada no catálogo`,
        nomeFerramenta,
      }, { status: 404 });
    }

    const ferramentaId = ferramentaEncontrada[0];
    const ferramentaNome = ferramentaEncontrada[1];

    // Verificar se já tem acesso ativo
    const acessoExistente = acessoRows.find(
      (row) => row[1] === funcionarioId && row[2] === ferramentaId && row[3] === "Ativo"
    );

    if (acessoExistente) {
      return NextResponse.json({
        success: false,
        message: `${funcionarioNome} já tem acesso ativo à ${ferramentaNome}`,
        funcionarioId,
        ferramentaId,
      });
    }

    // Criar acesso com status "Pendente concessão"
    const acessoId = `ac${Date.now()}`;
    await appendSheetRow("acessos!A:F", [
      acessoId,
      funcionarioId,
      ferramentaId,
      "Pendente concessão",
      hoje,
      "monday-solicitacao",
    ]);

    return NextResponse.json({
      success: true,
      message: `Solicitação de acesso criada para ${funcionarioNome} → ${ferramentaNome}`,
      funcionarioId,
      ferramentaId,
      status: "Pendente concessão",
    });

  } catch (error) {
    console.error("Erro na solicitação de acesso:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
