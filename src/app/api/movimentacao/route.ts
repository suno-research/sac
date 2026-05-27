import { NextResponse } from "next/server";
import { appendSheetRow, getSheetData } from "@/lib/sheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tipo, // "onboarding" ou "offboarding"
      nome,
      email,
      cargo,
      area,
      gestorEmail: _gestorEmail,
      dataEvento,
    } = body;

    // Gerar ID único
    const timestamp = Date.now();
    const funcionarioId = `u${timestamp}`;
    const movimentacaoId = `m${timestamp}`;

    if (tipo === "onboarding") {
      // 1. Adicionar funcionário na aba funcionarios
      await appendSheetRow("funcionarios!A:I", [
        funcionarioId,
        nome,
        email,
        cargo,
        area,
        "", // gestorId — será resolvido depois
        "Ativo",
        dataEvento || new Date().toISOString().split("T")[0],
        "",
      ]);

      // 2. Buscar perfil padrão do cargo
      const perfisRows = await getSheetData("perfis_padrao!A2:E");
      const perfil = perfisRows.find(
        (row) =>
          row[1]?.toLowerCase().includes(cargo?.toLowerCase()) ||
          cargo?.toLowerCase().includes(row[1]?.toLowerCase())
      );

      // 3. Se encontrou perfil, criar acessos pendentes
      if (perfil && perfil[3]) {
        const ferramentaIds = perfil[3].split(",").map((s) => s.trim());
        for (const ferramentaId of ferramentaIds) {
          const acessoId = `a${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
          await appendSheetRow("acessos!A:F", [
            acessoId,
            funcionarioId,
            ferramentaId,
            "Pendente concessão",
            "",
            "Monday/n8n",
          ]);
        }
      }

      // 4. Registrar movimentação
      await appendSheetRow("movimentacoes!A:E", [
        movimentacaoId,
        funcionarioId,
        "onboarding",
        dataEvento || new Date().toISOString().split("T")[0],
        "Pendente",
      ]);

      return NextResponse.json({
        success: true,
        tipo: "onboarding",
        funcionarioId,
        mensagem: `Onboarding de ${nome} registrado com sucesso`,
      });
    } else if (tipo === "offboarding") {
      // 1. Buscar funcionário pelo email
      const funcRows = await getSheetData("funcionarios!A2:I");
      const funcRow = funcRows.find((row) => row[2]?.toLowerCase() === email?.toLowerCase());

      if (!funcRow) {
        return NextResponse.json(
          { error: `Funcionário com email ${email} não encontrado` },
          { status: 404 }
        );
      }

      const funcId = funcRow[0];

      // 2. Atualizar status para Desligado
      const rowIndex = funcRows.findIndex((row) => row[2]?.toLowerCase() === email?.toLowerCase());
      const _sheetRow = rowIndex + 2; // +2 por causa do header e índice 0

      await appendSheetRow("movimentacoes!A:E", [
        movimentacaoId,
        funcId,
        "offboarding",
        dataEvento || new Date().toISOString().split("T")[0],
        "Em andamento",
      ]);

      // 3. Criar registro de offboarding
      const offboardingId = `off${timestamp}`;
      await appendSheetRow("offboardings!A:G", [
        offboardingId,
        funcId,
        dataEvento || new Date().toISOString().split("T")[0],
        new Date().toISOString().split("T")[0],
        "",
        "Em andamento",
        "u01",
      ]);

      // 4. Marcar acessos ativos como Pendente remoção
      const acessosRows = await getSheetData("acessos!A2:F");
      const acessosAtivos = acessosRows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => row[1] === funcId && row[3] === "Ativo");

      for (const { row, idx } of acessosAtivos) {
        const _sheetRowAcesso = idx + 2;
        // Append novo registro com status atualizado
        await appendSheetRow("acessos!A:F", [
          `${row[0]}_off`,
          funcId,
          row[2],
          "Pendente remoção",
          row[4] || "",
          row[5] || "",
        ]);
      }

      return NextResponse.json({
        success: true,
        tipo: "offboarding",
        funcionarioId: funcId,
        offboardingId,
        mensagem: `Offboarding de ${nome} registrado. ${acessosAtivos.length} acessos marcados para remoção.`,
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Erro na movimentação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
