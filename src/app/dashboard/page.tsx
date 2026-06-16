"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, Clock, AlertCircle, Grid, ArrowRight, ChevronRight } from "lucide-react";
import type {
  Funcionario,
  Ferramenta,
  AcessoFuncionario,
  Movimentacao,
  Offboarding,
} from "@/lib/mock-data";
import {
  thDashFirst,
  thDashMid,
  thDashLast,
  tdDashName,
  tdDashMid,
  tdDashLast,
  thFirst,
  thMid,
  thLast,
  tdName,
  tdCargo,
  tdMid,
  tdLast,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/ui/kpi-card";
import { TableCard } from "@/components/ui/table-card";
import { Avatar } from "@/components/ui/avatar";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "user";
  const userEmail = session?.user?.email ?? "";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [acessos, setAcessos] = useState<AcessoFuncionario[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/acessos").then((r) => r.json()),
      fetch("/api/movimentacoes").then((r) => r.json()),
      fetch("/api/offboardings").then((r) => r.json()),
    ])
      .then(([funcs, ferrs, acess, movs, offs]) => {
        setFuncionarios(Array.isArray(funcs) ? funcs : []);
        setFerramentas(Array.isArray(ferrs) ? ferrs : []);
        setAcessos(Array.isArray(acess) ? acess : []);
        setMovimentacoes(Array.isArray(movs) ? movs : []);
        setOffboardings(Array.isArray(offs) ? offs : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getFuncionarioById = useMemo(() => {
    const map = new Map(funcionarios.map((f) => [f.id, f]));
    return (id: string) => map.get(id);
  }, [funcionarios]);

  const funcionariosFiltrados = useMemo(() => {
    if (role === "ti") return funcionarios.filter((f) => f.status === "Ativo");
    if (role === "gestor")
      return funcionarios.filter(
        (f) =>
          f.status === "Ativo" &&
          f.gestorId &&
          funcionarios.find((g) => g.email === userEmail)?.id === f.gestorId
      );
    return funcionarios.filter((f) => f.email === userEmail && f.status === "Ativo");
  }, [funcionarios, role, userEmail]);

  const idsFuncionariosFiltrados = useMemo(
    () => new Set(funcionariosFiltrados.map((f) => f.id)),
    [funcionariosFiltrados]
  );

  const movimentacoesFiltradas = useMemo(() => {
    if (role === "ti") return movimentacoes;
    return movimentacoes.filter((m) => idsFuncionariosFiltrados.has(m.funcionarioId));
  }, [movimentacoes, role, idsFuncionariosFiltrados]);

  const acessosFiltrados = useMemo(() => {
    if (role === "ti") return acessos;
    return acessos.filter((a) => idsFuncionariosFiltrados.has(a.funcionarioId));
  }, [acessos, role, idsFuncionariosFiltrados]);

  const offboardingsFiltrados = useMemo(() => {
    if (role === "ti") return offboardings;
    return offboardings.filter((o) => idsFuncionariosFiltrados.has(o.funcionarioId));
  }, [offboardings, role, idsFuncionariosFiltrados]);

  const totalAtivos = funcionariosFiltrados.length;
  const pendentesConcessao = acessosFiltrados.filter((a) => a.status === "Pendente concessão").length;
  const pendentesRemocao = acessosFiltrados.filter((a) => a.status === "Pendente remoção").length;
  const totalFerramentas = ferramentas.length;

  const ultimasMovimentacoes = [...movimentacoesFiltradas]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 6);

  const pendenciasMap = acessosFiltrados
    .filter((a) => a.status === "Pendente concessão" || a.status === "Pendente remoção")
    .reduce<Record<string, { funcionarioId: string; tipos: string[] }>>((acc, a) => {
      if (!acc[a.funcionarioId]) acc[a.funcionarioId] = { funcionarioId: a.funcionarioId, tipos: [] };
      if (!acc[a.funcionarioId].tipos.includes(a.status)) acc[a.funcionarioId].tipos.push(a.status);
      return acc;
    }, {});
  const pendenciasList = Object.values(pendenciasMap).slice(0, 5);

  const offboardingsAbertos = offboardingsFiltrados.filter((o) => o.status === "Em andamento");

  const kpis = [
    {
      label: "Funcionários ativos",
      value: totalAtivos,
      icon: <Users className="h-5 w-5" />,
      iconClassName: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
      href: "/funcionarios",
    },
    {
      label: "Acessos a conceder",
      value: pendentesConcessao,
      icon: <Clock className="h-5 w-5" />,
      iconClassName: "text-warning bg-warning-muted",
      href: role === "ti" || role === "gestor" ? "/pendencias" : undefined,
    },
    {
      label: "Acessos a remover",
      value: pendentesRemocao,
      icon: <AlertCircle className="h-5 w-5" />,
      iconClassName: "text-accent bg-accent-muted",
      href: role === "ti" || role === "gestor" ? "/pendencias" : undefined,
    },
    {
      label: "Ferramentas cadastradas",
      value: totalFerramentas,
      icon: <Grid className="h-5 w-5" />,
      iconClassName: "text-muted-foreground bg-muted",
      href: "/ferramentas",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-52 rounded-lg bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[180px] rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageMotion>
      <div className="space-y-10">
        <PageHeader
          title="Dashboard"
          description="Visão geral do controle de acessos da Suno"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>

        {offboardingsAbertos.length > 0 && (
          <div className="space-y-4">
            {offboardingsAbertos.map((o) => {
              const func = getFuncionarioById(o.funcionarioId);
              return (
                <div
                  key={o.id}
                  className="rounded-xl border border-destructive/20 bg-destructive-muted border-l-[3px] border-l-destructive p-6 xl:p-7"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-[15px]">Offboarding em andamento</p>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {func?.nome} — iniciado em{" "}
                          {new Date(o.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="border-destructive/30 text-destructive hover:bg-destructive-muted shrink-0">
                      <Link href={`/offboarding/${o.id}`}>
                        Ver checklist <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <TableCard
            title="Últimas movimentações"
            contentClassName="overflow-x-auto md:overflow-x-visible"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/funcionarios">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          >
            <table className="w-full min-w-0 table-fixed">
              <colgroup>
                <col style={{ width: "42%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thDashFirst} scope="col">Funcionário</th>
                  <th className={thDashMid} scope="col">Tipo</th>
                  <th className={thDashMid} scope="col">Data</th>
                  <th className={thDashLast} scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimasMovimentacoes.map((mov) => {
                  const func = getFuncionarioById(mov.funcionarioId);
                  return (
                    <tr key={mov.id} className={trHover}>
                      <td className={tdDashName}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          {func && <Avatar name={func.nome} size="md" />}
                          <span className="truncate font-medium text-foreground">{func?.nome ?? "—"}</span>
                        </div>
                      </td>
                      <td className={tdDashMid}>
                        <Badge variant={mov.tipo === "onboarding" ? "success" : "destructive"} className="text-[11px]">
                          {mov.tipo === "onboarding" ? "Onboarding" : "Offboarding"}
                        </Badge>
                      </td>
                      <td className={`${tdDashMid} tabular-nums text-xs`}>
                        {new Date(mov.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className={tdDashLast}>
                        <Badge
                          variant={
                            mov.status === "Concluído"
                              ? "success"
                              : mov.status === "Em andamento"
                                ? "warning"
                                : "muted"
                          }
                          className="text-[11px]"
                        >
                          {mov.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>

          <TableCard
            title="Pendências de acesso"
            contentClassName="overflow-x-auto md:overflow-x-visible"
            action={
              <Badge variant="warning">{pendentesConcessao + pendentesRemocao} itens</Badge>
            }
          >
            <table className="w-full min-w-0 table-fixed">
              <colgroup>
                <col style={{ width: "46%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thDashFirst} scope="col">Funcionário</th>
                  <th className={thDashMid} scope="col">Área</th>
                  <th className={thDashLast} scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendenciasList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      Nenhuma pendência
                    </td>
                  </tr>
                ) : (
                  pendenciasList.map((p) => {
                    const func = getFuncionarioById(p.funcionarioId);
                    return (
                      <tr key={p.funcionarioId} className={trHover}>
                        <td className={tdDashName}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            {func && <Avatar name={func.nome} size="md" />}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{func?.nome ?? "—"}</p>
                              <p className="truncate text-xs text-muted-foreground">{func?.cargo}</p>
                            </div>
                          </div>
                        </td>
                        <td className={tdDashMid}>
                          <span className="block truncate">{func?.area}</span>
                        </td>
                        <td className={tdDashLast}>
                          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                            <Link href={`/funcionarios/${p.funcionarioId}`}>
                              Ver acessos <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableCard>
        </div>

        <TableCard
          title="Funcionários"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/funcionarios">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className={thFirst}>Nome</th>
                <th className={`${thMid} min-w-[220px]`}>Cargo</th>
                <th className={thMid}>Área</th>
                <th className={thMid}>Status</th>
                <th className={thLast} />
              </tr>
            </thead>
            <tbody>
              {funcionariosFiltrados.slice(0, 6).map((func) => (
                <tr key={func.id} className={trHover}>
                  <td className={tdName}>
                    <div className="flex items-center gap-4">
                      <Avatar name={func.nome} size="md" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{func.nome}</p>
                        <p className="text-xs text-muted-foreground">{func.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdCargo}>{func.cargo}</td>
                  <td className={tdMid}>{func.area}</td>
                  <td className={tdMid}>
                    <Badge variant={func.status === "Ativo" ? "success" : "muted"}>{func.status}</Badge>
                  </td>
                  <td className={`${tdLast} text-right`}>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/funcionarios/${func.id}`}>
                        Ver acessos <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </PageMotion>
  );
}
