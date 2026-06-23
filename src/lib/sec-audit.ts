import { appendSecSheetRow } from "@/lib/sec-sheets";
import type { SECAuditLog } from "@/types/sec";

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

export function rowToAuditLog(row: string[]): SECAuditLog {
  return {
    audit_id: row[0] || "",
    timestamp: row[1] || "",
    entidade: row[2] || "",
    entidade_id: row[3] || "",
    acao: (row[4] as SECAuditLog["acao"]) || "CREATE",
    campo_alterado: row[5] || undefined,
    valor_anterior: row[6] || undefined,
    valor_novo: row[7] || undefined,
    usuario_email: row[8] || "",
    usuario_nome: row[9] || undefined,
    origem: row[10] || undefined,
    ip: row[11] || undefined,
    session_id: row[12] || undefined,
    observacao: row[13] || undefined,
  };
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
