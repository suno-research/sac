"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  ClipboardList,
  FileText,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { Alocacao, Ativo, Pendencia, Termo } from "@/types/sec";
import {
  statusAlocacaoLabel,
  statusAlocacaoVariant,
} from "@/lib/sec-alocacoes";
import { statusLabel, statusVariant, tipoLabel } from "@/lib/sec-ativos";
import {
  pendenciaRegistroHref,
  tipoPendenciaLabel,
} from "@/lib/sec-pendencias";
import {
  thDashFirst,
  thDashMid,
  thDashLast,
  tdDashName,
  tdDashMid,
  tdDashLast,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/ui/kpi-card";
import { TableCard } from "@/components/ui/table-card";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string): string {
  const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export default function SecDashboardPage() {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sec/ativos").then((r) => r.json()),
      fetch("/api/sec/alocacoes").then((r) => r.json()),
      fetch("/api/sec/estoque").then((r) => r.json()),
      fetch("/api/sec/pendencias").then((r) => r.json()),
      fetch("/api/sec/termos").then((r) => r.json()),
    ])
      .then(([ativosData, alocData, , pendData, termosData]) => {
        setAtivos(Array.isArray(ativosData) ? ativosData : []);
        setAlocacoes(Array.isArray(alocData) ? alocData : []);
        setPendencias(Array.isArray(pendData) ? pendData : []);
        setTermos(Array.isArray(termosData) ? termosData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ativosAtivos = useMemo(
    () => ativos.filter((a) => a.status === "ativo"),
    [ativos]
  );
  const alocacoesAtivas = useMemo(
    () => alocacoes.filter((a) => a.status === "ativa"),
    [alocacoes]
  );
  const termosPendentes = useMemo(
    () => termos.filter((t) => t.status === "pendente"),
    [termos]
  );

  const ultimasAlocacoes = useMemo(
    () =>
      [...alocacoes]
        .sort(
          (a, b) =>
            new Date(b.data_alocacao).getTime() -
            new Date(a.data_alocacao).getTime()
        )
        .slice(0, 6),
    [alocacoes]
  );

  const topPendencias = useMemo(() => pendencias.slice(0, 5), [pendencias]);

  const ativosRecentes = useMemo(
    () =>
      [...ativos]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 6),
    [ativos]
  );

  const kpis = [
    {
      label: "Ativos cadastrados",
      value: ativosAtivos.length,
      icon: <Monitor className="h-5 w-5" />,
      iconClassName:
        "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
      href: "/sec/ativos",
    },
    {
      label: "Alocações ativas",
      value: alocacoesAtivas.length,
      icon: <ClipboardList className="h-5 w-5" />,
      iconClassName: "text-success bg-success-muted",
      href: "/sec/alocacoes",
    },
    {
      label: "Termos pendentes",
      value: termosPendentes.length,
      icon: <FileText className="h-5 w-5" />,
      iconClassName: "text-warning bg-warning-muted",
      href: "/sec/termos",
    },
    {
      label: "Pendências abertas",
      value: pendencias.length,
      icon: <AlertTriangle className="h-5 w-5" />,
      iconClassName: "text-destructive bg-destructive-muted",
      href: "/sec/pendencias",
    },
  ];

  if (loading) {
    return (
      <PageMotion>
        <div className="space-y-10 min-w-0">
          <div className="space-y-2">
            <div className="h-9 w-48 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-5 w-72 max-w-full rounded-lg bg-muted/40 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[180px] rounded-xl bg-muted/60 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-muted/60 animate-pulse"
              />
            ))}
          </div>
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="space-y-10 min-w-0">
        <PageHeader
          title="Dashboard"
          description="Visão geral do módulo de equipamentos e patrimônio."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8 min-w-0">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>

        {pendencias.length > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive-muted border-l-[3px] border-l-destructive p-6 xl:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-foreground text-[15px]">
                  {pendencias.length} pendência(s) requer(em) atenção
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-destructive/30 text-destructive hover:bg-destructive-muted shrink-0"
              >
                <Link href="/sec/pendencias">
                  Ver pendências <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-w-0">
          <TableCard
            title="Últimas alocações"
            className="min-w-0"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sec/alocacoes">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          >
            {ultimasAlocacoes.length === 0 ? (
              <p className="px-8 py-14 text-center text-sm text-muted-foreground">
                Nenhuma alocação registrada
              </p>
            ) : (
              <table className="w-full max-w-full table-fixed">
                <colgroup>
                  <col style={{ width: "34%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead className="bg-muted/40">
                  <tr>
                    <th className={thDashFirst} scope="col">
                      Funcionário
                    </th>
                    <th className={thDashMid} scope="col">
                      Equipamento ID
                    </th>
                    <th className={thDashMid} scope="col">
                      Status
                    </th>
                    <th className={thDashLast} scope="col">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasAlocacoes.map((a) => (
                    <tr key={a.alocacao_id} className={trHover}>
                      <td className={tdDashName}>
                        <span className="block truncate font-medium text-foreground">
                          {a.funcionario_nome}
                        </span>
                      </td>
                      <td className={tdDashMid}>
                        <span className="block truncate text-xs font-mono">
                          {a.equipamento_id}
                        </span>
                      </td>
                      <td className={tdDashMid}>
                        <Badge
                          variant={statusAlocacaoVariant(a.status)}
                          className="max-w-full truncate text-[11px]"
                        >
                          {statusAlocacaoLabel(a.status)}
                        </Badge>
                      </td>
                      <td className={`${tdDashLast} tabular-nums text-xs`}>
                        <span className="whitespace-nowrap">
                          {formatDate(a.data_alocacao)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableCard>

          <TableCard
            title="Pendências"
            className="min-w-0"
            action={
              <Badge variant="warning">{pendencias.length} abertas</Badge>
            }
          >
            <table className="w-full max-w-full table-fixed">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "40%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thDashFirst} scope="col">
                    Tipo
                  </th>
                  <th className={thDashMid} scope="col">
                    Título
                  </th>
                  <th className={thDashLast} scope="col">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPendencias.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-14 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma pendência em aberto 🎉
                    </td>
                  </tr>
                ) : (
                  topPendencias.map((p) => {
                    const href = pendenciaRegistroHref(
                      p.entidade,
                      p.entidade_id
                    );
                    return (
                      <tr key={p.pendencia_id} className={trHover}>
                        <td className={tdDashMid}>
                          <span className="block truncate text-xs">
                            {tipoPendenciaLabel(p.tipo)}
                          </span>
                        </td>
                        <td className={tdDashName}>
                          <span className="block truncate font-medium text-foreground">
                            {p.titulo}
                          </span>
                        </td>
                        <td className={tdDashLast}>
                          {href ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 max-w-full px-2 text-xs"
                            >
                              <Link href={href} className="truncate">
                                Ver registro{" "}
                                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
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
          title="Ativos recentes"
          className="min-w-0"
          contentClassName="overflow-hidden max-lg:overflow-x-auto"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sec/ativos">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <table className="w-full max-w-full table-fixed">
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead className="bg-muted/40">
              <tr>
                <th className={thDashFirst} scope="col">
                  Nome/Modelo
                </th>
                <th className={thDashMid} scope="col">
                  Tipo
                </th>
                <th className={thDashMid} scope="col">
                  Marca
                </th>
                <th className={thDashMid} scope="col">
                  Status
                </th>
                <th className={thDashMid} scope="col">
                  Data de cadastro
                </th>
                <th className={thDashLast} scope="col" />
              </tr>
            </thead>
            <tbody>
              {ativosRecentes.map((ativo) => (
                <tr key={ativo.equipamento_id} className={trHover}>
                  <td className={tdDashName}>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate font-medium text-foreground">
                        {ativo.nome}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ativo.modelo}
                      </p>
                    </div>
                  </td>
                  <td className={tdDashMid}>
                    <span className="block truncate text-xs">
                      {tipoLabel(ativo.tipo)}
                    </span>
                  </td>
                  <td className={tdDashMid}>
                    <span className="block truncate">{ativo.marca || "—"}</span>
                  </td>
                  <td className={tdDashMid}>
                    <Badge
                      variant={statusVariant(ativo.status)}
                      className="text-[11px]"
                    >
                      {statusLabel(ativo.status)}
                    </Badge>
                  </td>
                  <td className={`${tdDashMid} tabular-nums text-xs`}>
                    <span className="whitespace-nowrap">
                      {formatDate(ativo.created_at)}
                    </span>
                  </td>
                  <td className={tdDashLast}>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2"
                      aria-label={`Ver ativo ${ativo.nome}`}
                    >
                      <Link href={`/sec/ativos/${ativo.equipamento_id}`}>
                        <ChevronRight className="h-4 w-4" />
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
