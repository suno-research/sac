import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData, appendSecSheetRow } from "@/lib/sec-sheets";
import {
  generateAtivoId,
  rowToAtivo,
  ativoToRow,
} from "@/lib/sec-ativos";
import { logSECAudit } from "@/lib/sec-audit";
import type { CreateAtivoPayload } from "@/types/sec";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const rows = await getSecSheetData("EQUIPAMENTOS!A2:U");
    const ativos = rows
      .map(rowToAtivo)
      .filter((a) => a.equipamento_id.trim() !== "");

    return NextResponse.json(ativos);
  } catch (error) {
    console.error("Erro ao buscar ativos:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao buscar ativos. Verifique se a aba EQUIPAMENTOS existe na planilha SEC.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as CreateAtivoPayload;
    const { nome, tipo, marca, modelo, status } = body;

    if (!nome?.trim() || !tipo || !marca?.trim() || !modelo?.trim() || !status) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, tipo, marca, modelo, status" },
        { status: 400 }
      );
    }

    const email = session.user.email ?? "";
    const now = new Date().toISOString();

    const novoAtivo = {
      equipamento_id: generateAtivoId(),
      nome: nome.trim(),
      tipo,
      marca: marca.trim(),
      modelo: modelo.trim(),
      numero_serie: body.numero_serie?.trim() || undefined,
      numero_patrimonio: body.numero_patrimonio?.trim() || undefined,
      status,
      localizacao_atual: body.localizacao_atual?.trim() || undefined,
      data_aquisicao: body.data_aquisicao || undefined,
      valor_aquisicao: body.valor_aquisicao || undefined,
      fornecedor: body.fornecedor?.trim() || undefined,
      nota_fiscal: body.nota_fiscal?.trim() || undefined,
      garantia_ate: body.garantia_ate || undefined,
      observacoes: body.observacoes?.trim() || undefined,
      created_at: now,
      created_by: email,
      updated_at: now,
      updated_by: email,
    };

    await appendSecSheetRow("EQUIPAMENTOS!A:U", ativoToRow(novoAtivo));

    await logSECAudit({
      entidade: "EQUIPAMENTOS",
      entidade_id: novoAtivo.equipamento_id,
      acao: "CREATE",
      valor_novo: JSON.stringify(novoAtivo),
      usuario_email: email,
      usuario_nome: session.user.name ?? undefined,
      origem: "app",
    });

    return NextResponse.json(novoAtivo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ativo:", error);
    const message =
      error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
        ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
        : "Erro ao criar ativo. Verifique se a aba EQUIPAMENTOS existe na planilha SEC.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
