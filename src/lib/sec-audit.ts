import { appendSecSheetRow } from "@/lib/sec-sheets";

export interface SECAuditEntry {
  entidade: string;
  entidade_id: string;
  acao: "CREATE" | "UPDATE" | "DELETE";
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;
  usuario_email: string;
  usuario_nome?: string;
  origem?: string;
  ip?: string;
  session_id?: string;
  observacao?: string;
}

export function generateAuditId(): string {
  return `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function logSECAudit(entry: SECAuditEntry): Promise<void> {
  const auditId = generateAuditId();
  const timestamp = new Date().toISOString();

  await appendSecSheetRow("_AUDITORIA!A:N", [
    auditId,
    timestamp,
    entry.entidade,
    entry.entidade_id,
    entry.acao,
    entry.campo_alterado ?? "",
    entry.valor_anterior ?? "",
    entry.valor_novo ?? "",
    entry.usuario_email,
    entry.usuario_nome ?? "",
    entry.origem ?? "app",
    entry.ip ?? "",
    entry.session_id ?? "",
    entry.observacao ?? "",
  ]);
}
