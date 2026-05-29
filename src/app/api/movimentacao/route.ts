import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow, updateSheetRow } from "@/lib/sheets";

// Normaliza nome para comparação
function normalizar(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, " ");
}

// Match fuzzy por tokens — retorna score
function calcularScore(nomeA: string, nomeB: string): number {
  const tokensA = new Set(normalizar(nomeA).split(" "));
  const tokensB = new Set(normalizar(nomeB).split(" "));
  const intersec = [...tokensA].filter((t) => tokensB.has(t));
  let score = intersec.length;
  const partesA = normalizar(nomeA).split(" ");
  const partesB = normalizar(nomeB).split(" ");
  if (partesA[0] === partesB[0]) score += 0.5;
  if (partesA[partesA.length - 1] === partesB[partesB.length - 1]) score += 0.5;
  return score;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, nome, email, cargo, area, dataEvento } = body;

    if (!tipo || !nome) {
      return NextResponse.json({ error: "tipo e nome são obrigatórios" }, { status: 400 });
    }

    const hoje = dataEvento || new Date().toISOString().split("T")[0];

    // Buscar dados existentes
    const [funcRows, acessoRows, perfilRows] = await Promise.all([
      getSheetData("funcionarios!A2:I"),
      getSheetData("acessos!A2:F"),
      getSheetData("perfis_padrao!A2:E"),
    ]);

    // Mapear funcionários (usado no offboarding)
    const funcionarios = funcRows.map((row) => ({
      id: row[0] || "",
      nome: row[1] || "",
      email: row[2] || "",
      cargo: row[3] || "",
      area: row[4] || "",
      gestorId: row[5] || "",
      status: row[6] || "Ativo",
      dataEntrada: row[7] || "",
      dataDesligamento: row[8] || "",
    })).filter((f) => f.id);

    function buscarFuncionarioPorNome() {
      let encontrado = null;
      let melhorScore = 0;
      for (const func of funcionarios) {
        const score = calcularScore(nome, func.nome);
        if (score > melhorScore && score >= 1.5) {
          melhorScore = score;
          encontrado = func;
        }
      }
      return encontrado;
    }

    // ==================
    // ONBOARDING
    // ==================
    if (tipo === "onboarding") {
      const funcionarioId = `u${Date.now()}`;

      await appendSheetRow("funcionarios!A:I", [
        funcionarioId,
        nome,
        email || "",
        cargo || "",
        area || "",
        "",
        "Ativo",
        hoje,
        "",
      ]);

      const areaFunc = area || "";
      const perfil = areaFunc
        ? perfilRows.find((p) => p[2] && normalizar(p[2]) === normalizar(areaFunc))
        : undefined;

      const ferramentaIds: string[] = perfil && perfil[3]
        ? perfil[3].split(",").map((s: string) => s.trim()).filter(Boolean)
        : ["f01", "f02", "f08", "f03"];

      const dataConcessao = hoje;
      for (const ferramentaId of ferramentaIds) {
        const acId = `ac${Date.now()}-${ferramentaId}`;
        await appendSheetRow("acessos!A:F", [
          acId,
          funcionarioId,
          ferramentaId,
          "Ativo",
          dataConcessao,
          "monday-automation",
        ]);
        await new Promise((r) => setTimeout(r, 50));
      }

      const movId = `mov${Date.now()}`;
      await appendSheetRow("movimentacoes!A:E", [
        movId,
        funcionarioId,
        "onboarding",
        hoje,
        "concluido",
      ]);

      return NextResponse.json({
        success: true,
        tipo: "onboarding",
        funcionarioId,
        nome,
        acessosCriados: ferramentaIds.length,
        perfilAplicado: perfil ? perfil[1] : "padrão mínimo",
      });
    }

    // ==================
    // OFFBOARDING
    // ==================
    if (tipo === "offboarding") {
      const funcionario = buscarFuncionarioPorNome();

      if (!funcionario) {
        return NextResponse.json({
          error: `Funcionário "${nome}" não encontrado na base para offboarding`,
          tipo: "offboarding",
          nome,
        }, { status: 404 });
      }

      const funcionarioId = funcionario.id;

      // Atualizar status do funcionário para Desligado
      const rowIndex = funcRows.findIndex((r) => r[0] === funcionarioId);
      if (rowIndex !== -1) {
        const sheetRow = rowIndex + 2;
        await updateSheetRow(`funcionarios!A${sheetRow}:I${sheetRow}`, [
          funcionario.id,
          funcionario.nome,
          funcionario.email,
          funcionario.cargo,
          funcionario.area,
          funcionario.gestorId,
          "Desligado",
          funcionario.dataEntrada,
          hoje,
        ]);
      }

      // Marcar acessos ativos como "Pendente remoção"
      for (let i = 0; i < acessoRows.length; i++) {
        const row = acessoRows[i];
        if (row[1] === funcionarioId && row[3] === "Ativo") {
          const sheetRow = i + 2;
          await updateSheetRow(`acessos!A${sheetRow}:F${sheetRow}`, [
            row[0], row[1], row[2], "Pendente remoção", row[4] || "", row[5] || "",
          ]);
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      // Criar registro de offboarding
      const offId = `off${Date.now()}`;
      await appendSheetRow("offboardings!A:G", [
        offId,
        funcionarioId,
        hoje,
        hoje,
        "",
        "Em andamento",
        "monday-automation",
      ]);

      // Registrar movimentação
      const movId = `mov${Date.now()}`;
      await appendSheetRow("movimentacoes!A:E", [
        movId,
        funcionarioId,
        "offboarding",
        hoje,
        "em andamento",
      ]);

      return NextResponse.json({
        success: true,
        tipo: "offboarding",
        funcionarioId,
        nome: funcionario.nome,
        offboardingId: offId,
      });
    }

    return NextResponse.json({ error: "Tipo inválido. Use onboarding ou offboarding." }, { status: 400 });

  } catch (error) {
    console.error("Erro na movimentação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
