"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatOrigemAcesso, daysSinceDate } from "@/lib/governance";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  area: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
}

interface Acesso {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: string;
  dataConcessao: string;
  concedidoPor: string;
}

interface PendenciaItem {
  acesso: Acesso;
  funcionario: Funcionario | undefined;
  ferramenta: Ferramenta | undefined;
}

function SkeletonSection() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 64, background: "#F3F4F6", borderRadius: 8 }} />
      ))}
    </div>
  );
}

export default function PendenciasPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvendo, setResolvendo] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const [funcs, ferrs, acess] = await Promise.all([
        fetch("/api/funcionarios").then((r) => r.json()),
        fetch("/api/ferramentas").then((r) => r.json()),
        fetch("/api/acessos").then((r) => r.json()),
      ]);
      setFuncionarios(Array.isArray(funcs) ? funcs : []);
      setFerramentas(Array.isArray(ferrs) ? ferrs : []);
      setAcessos(Array.isArray(acess) ? acess : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const getFuncionario = (id: string) => funcionarios.find((f) => f.id === id);
  const getFerramenta = (id: string) => ferramentas.find((f) => f.id === id);

  const userEmail = session?.user?.email ?? "";
  const role = session?.user?.role ?? "user";

  const funcionarioDoUsuario = funcionarios.find((f) => f.email === userEmail);
  const gestorId = funcionarioDoUsuario?.id;

  const acessosFiltrados = useMemo(() => {
    if (role === "ti") return acessos;
    if (role === "gestor")
      return acessos.filter((a) => {
        const func = funcionarios.find((f) => f.id === a.funcionarioId);
        return func?.gestorId === gestorId;
      });
    return acessos.filter((a) => a.funcionarioId === funcionarioDoUsuario?.id);
  }, [acessos, role, funcionarios, gestorId, funcionarioDoUsuario]);

  const pendentesRemocao: PendenciaItem[] = acessosFiltrados
    .filter((a) => a.status === "Pendente remoção")
    .map((a) => ({
      acesso: a,
      funcionario: getFuncionario(a.funcionarioId),
      ferramenta: getFerramenta(a.ferramentaId),
    }));

  const pendentesConcessao: PendenciaItem[] = acessosFiltrados
    .filter((a) => a.status === "Pendente concessão")
    .map((a) => ({
      acesso: a,
      funcionario: getFuncionario(a.funcionarioId),
      ferramenta: getFerramenta(a.ferramentaId),
    }));

  async function resolverAcesso(acessoId: string, novoStatus: string) {
    setResolvendo(acessoId);
    try {
      const res = await fetch("/api/acessos/resolver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acessoId, novoStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Erro ao resolver acesso:", err);
        toast("Erro ao resolver pendência.", "error");
        return;
      }

      setAcessos((prev) =>
        prev.map((a) => (a.id === acessoId ? { ...a, status: novoStatus } : a))
      );
      toast(
        novoStatus === "Ativo"
          ? "Concessão confirmada com sucesso."
          : "Remoção confirmada com sucesso."
      );
    } catch (e) {
      console.error("Erro ao resolver acesso", e);
      toast("Erro ao resolver pendência.", "error");
    } finally {
      setResolvendo(null);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Pendências" description="Carregando..." />
        <SkeletonSection />
      </PageMotion>
    );
  }

  const total = pendentesRemocao.length + pendentesConcessao.length;

  return (
    <PageMotion>
      <PageHeader
        title="Pendências"
        description={
          total === 0
            ? "Nenhuma pendência no momento"
            : `${total} pendência${total > 1 ? "s" : ""} aguardando resolução`
        }
      />

      <div className="space-y-8">

        {/* Seção — Pendente remoção */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Pendente remoção</h2>
            <Badge variant="destructive">{pendentesRemocao.length}</Badge>
          </div>

          {pendentesRemocao.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum acesso pendente de remoção ✅
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="pl-8 pr-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramenta</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origem</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dias</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Área</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                    <th className="pl-4 pr-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendentesRemocao.map(({ acesso, funcionario, ferramenta }) => {
                    const dias = daysSinceDate(acesso.dataConcessao);
                    return (
                    <tr key={acesso.id} className="hover:bg-muted/30 transition-colors">
                      <td className="pl-8 pr-4 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={funcionario?.nome || "?"} size="md" />
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {funcionario?.nome || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{funcionario?.cargo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-medium text-sm text-foreground">{ferramenta?.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{ferramenta?.categoria}</p>
                      </td>
                      <td className="px-4 py-5 text-sm text-muted-foreground">
                        {formatOrigemAcesso(acesso.concedidoPor)}
                      </td>
                      <td className="px-4 py-5 text-sm tabular-nums text-muted-foreground">
                        {acesso.dataConcessao
                          ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-4 py-5">
                        {dias !== null ? (
                          <Badge variant={dias > 7 ? "destructive" : dias > 3 ? "warning" : "secondary"}>
                            {dias}d
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <Badge variant="secondary">{funcionario?.area || "—"}</Badge>
                      </td>
                      <td className="px-4 py-5">
                        <Badge variant={ferramenta?.tipo === "Passbolt" ? "warning" : "secondary"}>
                          {ferramenta?.tipo || "—"}
                        </Badge>
                      </td>
                      <td className="pl-4 pr-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTI && (
                            <Button
                              size="sm"
                              onClick={() => resolverAcesso(acesso.id, "Sem acesso")}
                              disabled={resolvendo === acesso.id}
                              style={{ background: "#D42126", color: "white" }}
                              className="gap-1.5"
                            >
                              {resolvendo === acesso.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Confirmar remoção
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/funcionarios/${acesso.funcionarioId}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção — Pendente concessão */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Pendente concessão</h2>
            <Badge variant="warning">{pendentesConcessao.length}</Badge>
          </div>

          {pendentesConcessao.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum acesso pendente de concessão ✅
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="pl-8 pr-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramenta</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origem</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dias</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Área</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                    <th className="pl-4 pr-8 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendentesConcessao.map(({ acesso, funcionario, ferramenta }) => {
                    const dias = daysSinceDate(acesso.dataConcessao);
                    return (
                    <tr key={acesso.id} className="hover:bg-muted/30 transition-colors">
                      <td className="pl-8 pr-4 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={funcionario?.nome || "?"} size="md" />
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {funcionario?.nome || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{funcionario?.cargo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-medium text-sm text-foreground">{ferramenta?.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{ferramenta?.categoria}</p>
                      </td>
                      <td className="px-4 py-5 text-sm text-muted-foreground">
                        {formatOrigemAcesso(acesso.concedidoPor)}
                      </td>
                      <td className="px-4 py-5 text-sm tabular-nums text-muted-foreground">
                        {acesso.dataConcessao
                          ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-4 py-5">
                        {dias !== null ? (
                          <Badge variant={dias > 7 ? "destructive" : dias > 3 ? "warning" : "secondary"}>
                            {dias}d
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <Badge variant="secondary">{funcionario?.area || "—"}</Badge>
                      </td>
                      <td className="px-4 py-5">
                        <Badge variant={ferramenta?.tipo === "Passbolt" ? "warning" : "secondary"}>
                          {ferramenta?.tipo || "—"}
                        </Badge>
                      </td>
                      <td className="pl-4 pr-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTI && (
                            <Button
                              size="sm"
                              onClick={() => resolverAcesso(acesso.id, "Ativo")}
                              disabled={resolvendo === acesso.id}
                              className="gap-1.5 bg-success hover:opacity-90 text-white"
                            >
                              {resolvendo === acesso.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Confirmar concessão
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/funcionarios/${acesso.funcionarioId}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PageMotion>
  );
}
