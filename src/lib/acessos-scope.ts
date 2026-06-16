export interface FuncionarioScope {
  id: string;
  email: string;
  gestorId?: string;
}

export interface AcessoScope {
  funcionarioId: string;
  status: string;
}

export function filterAcessosByRole<T extends AcessoScope>(
  acessos: T[],
  funcionarios: FuncionarioScope[],
  role: string,
  userEmail: string
): T[] {
  if (role === "ti") return acessos;

  if (role === "gestor") {
    const gestor = funcionarios.find((f) => f.email === userEmail);
    if (!gestor) return [];
    return acessos.filter((a) => {
      const func = funcionarios.find((f) => f.id === a.funcionarioId);
      return func?.gestorId === gestor.id;
    });
  }

  const self = funcionarios.find((f) => f.email === userEmail);
  if (!self) return [];
  return acessos.filter((a) => a.funcionarioId === self.id);
}

export function countPendencias(acessos: { status: string }[]): number {
  return acessos.filter(
    (a) => a.status === "Pendente concessão" || a.status === "Pendente remoção"
  ).length;
}
