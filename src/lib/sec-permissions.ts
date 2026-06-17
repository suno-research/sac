type SECRole = "ti" | "gestor" | "user" | string | undefined;

export function canWriteSEC(role: SECRole): boolean {
  return role === "ti";
}

export function canApproveSEC(role: SECRole): boolean {
  return role === "ti" || role === "gestor";
}
