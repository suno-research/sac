import { NextResponse } from "next/server";
import { getSecSheetData, updateSecSheetRow } from "@/lib/sec-sheets";
import { alocacaoToRow, rowToAlocacao } from "@/lib/sec-alocacoes";
import { logSECAudit } from "@/lib/sec-audit";
import { isValidWebhookSecret } from "@/lib/sec-webhook";
import type { Alocacao, EventoN8NPayload } from "@/types/sec";

async function processarOffboardingIniciado(
  payload: EventoN8NPayload
): Promise<number> {
  const rows = await getSecSheetData("ALOCACOES!A2:R");
  const now = new Date().toISOString();
  let afetadas = 0;

  for (let i = 0; i < rows.length; i++) {
    const alocacao = rowToAlocacao(rows[i]);
    if (
      alocacao.deleted_at ||
      alocacao.funcionario_id !== payload.funcionario_id ||
      alocacao.status !== "ativa"
    ) {
      continue;
    }

    const updated: Alocacao = {
      ...alocacao,
      status: "pendente",
      updated_at: now,
      updated_by: "n8n@sistema",
    };

    const sheetRow = i + 2;
    await updateSecSheetRow(
      `ALOCACOES!A${sheetRow}:R${sheetRow}`,
      alocacaoToRow(updated)
    );

    await logSECAudit({
      entidade: "ALOCACOES",
      entidade_id: alocacao.alocacao_id,
      acao: "UPDATE",
      campo_alterado: "status",
      valor_anterior: "ativa",
      valor_novo: "pendente",
      usuario_email: payload.funcionario_email,
      usuario_nome: payload.funcionario_nome,
      origem: "n8n",
      observacao: `offboarding_iniciado${payload.offboarding_id ? ` — ${payload.offboarding_id}` : ""}`,
    });

    afetadas++;
  }

  return afetadas;
}

async function processarOffboardingConcluido(
  payload: EventoN8NPayload
): Promise<number> {
  const rows = await getSecSheetData("ALOCACOES!A2:R");
  let pendencias = 0;

  for (const row of rows) {
    const alocacao = rowToAlocacao(row);
    if (
      alocacao.deleted_at ||
      alocacao.funcionario_id !== payload.funcionario_id ||
      alocacao.status !== "pendente"
    ) {
      continue;
    }

    await logSECAudit({
      entidade: "ALOCACOES",
      entidade_id: alocacao.alocacao_id,
      acao: "UPDATE",
      usuario_email: payload.funcionario_email || "n8n@sistema",
      usuario_nome: payload.funcionario_nome,
      origem: "n8n",
      observacao:
        "offboarding_concluido — aguardando confirmação de devolução física",
    });

    pendencias++;
  }

  return pendencias;
}

export async function POST(request: Request) {
  try {
    if (!isValidWebhookSecret(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as EventoN8NPayload;

    if (!body.evento) {
      return NextResponse.json(
        { error: "Campo evento é obrigatório" },
        { status: 400 }
      );
    }

    if (body.evento === "offboarding_iniciado") {
      if (
        !body.funcionario_id?.trim() ||
        !body.funcionario_nome?.trim() ||
        !body.funcionario_email?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Campos obrigatórios: funcionario_id, funcionario_nome, funcionario_email",
          },
          { status: 400 }
        );
      }

      const alocacoesAfetadas = await processarOffboardingIniciado(body);

      return NextResponse.json({
        processado: true,
        alocacoes_afetadas: alocacoesAfetadas,
        funcionario_id: body.funcionario_id,
      });
    }

    if (body.evento === "offboarding_concluido") {
      if (!body.funcionario_id?.trim()) {
        return NextResponse.json(
          { error: "Campo funcionario_id é obrigatório" },
          { status: 400 }
        );
      }

      const pendenciasEmAberto = await processarOffboardingConcluido(body);

      return NextResponse.json({
        processado: true,
        pendencias_em_aberto: pendenciasEmAberto,
        funcionario_id: body.funcionario_id,
      });
    }

    return NextResponse.json(
      { error: "Evento não suportado" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro no webhook n8n:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar evento" },
      { status: 500 }
    );
  }
}
