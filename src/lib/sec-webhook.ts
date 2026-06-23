/**
 * Verifica se o header Authorization da requisição contém
 * o segredo correto: "Bearer {N8N_WEBHOOK_SECRET}"
 * Retorna true se válido, false caso contrário.
 * Nunca lança exceção — apenas retorna booleano.
 */
export function isValidWebhookSecret(request: Request): boolean {
  const authHeader = request.headers.get("Authorization") ?? "";
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret || !authHeader) return false;
  return authHeader === `Bearer ${secret}`;
}
