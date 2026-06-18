"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Monitor,
  Package,
  SearchX,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import type { Alocacao, Pendencia, TipoPendencia } from "@/types/sec";
import {
  statusAlocacaoLabel,
  statusAlocacaoVariant,
} from "@/lib/sec-alocacoes";
import {
  tipoPendenciaCardLabel,
  tipoPendenciaLabel,
  pendenciaRegistroHref,
  TODOS_TIPOS_PENDENCIA,
} from "@/lib/sec-pendencias";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactName,
  tdCompactText,
  tdCompactActions,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageMotion } from "@/components/ui/page-motion";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = [10, 50, 100];

const KPI_CONFIG: {
  tipo: TipoPendencia;
  icon: React.ReactNode;
  iconClassName: string;
}[] = [
  {
    tipo: "equipamento_sem_responsavel",
    icon: <Monitor className="h-5 w-5" />,
    iconClassName: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
  },
  {
    tipo: "devolucao_atrasada",
    icon: <Undo2 className="h-5 w-5" />,
    iconClassName: "text-warning bg-warning-muted",
  },
  {
    tipo: "patrimonio_sem_tombamento",
    icon: <ShieldCheck className="h-5 w-5" />,
    iconClassName: "text-accent bg-accent-muted",
  },
  {
    tipo: "estoque_abaixo_minimo",
    icon: <Package className="h-5 w-5" />,
    iconClassName: "text-destructive bg-destructive-muted",
  },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[180px] rounded-xl bg-muted/60 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted/60 animate-pulse" />
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function PendenciasSECPage() {
  const { toast } = useToast();

  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  const [alocacaoDetalhe, setAlocacaoDetalhe] = useState<Alocacao | null>(null);
  const [carregandoAlocacao, setCarregandoAlocacao] = useState(false);

  useEffect(() => {
    fetch("/api/sec/pendencias")
      .then((r) => r.json())
      .then((data) => {
        setPendencias(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast("Erro ao carregar pendências.", "error");
        setPendencias([]);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const contagemPorTipo = useMemo(() => {
    const counts: Record<TipoPendencia, number> = {
      equipamento_sem_responsavel: 0,
      devolucao_atrasada: 0,
      patrimonio_sem_tombamento: 0,
      estoque_abaixo_minimo: 0,
    };
    pendencias.forEach((p) => {
      if (counts[p.tipo] !== undefined) counts[p.tipo]++;
    });
    return counts;
  }, [pendencias]);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return pendencias.filter((p) => {
      const matchTipo = tipoFiltro === "todos" || p.tipo === tipoFiltro;
      const matchBusca =
        !q ||
        p.titulo.toLowerCase().includes(q) ||
        p.entidade_id.toLowerCase().includes(q) ||
        (p.descricao?.toLowerCase().includes(q) ?? false);
      return matchTipo && matchBusca;
    });
  }, [pendencias, busca, tipoFiltro]);

  const paginationKey = `${tipoFiltro}|${busca}|${pageSize}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const setCurrentPage = (page: number) => {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageByKey((prev) => ({
      ...prev,
      [`${tipoFiltro}|${busca}|${size}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const hasFilters = Boolean(busca || tipoFiltro !== "todos");

  const clearFilters = () => {
    setBusca("");
    setTipoFiltro("todos");
  };

  async function abrirAlocacao(alocacaoId: string) {
    setCarregandoAlocacao(true);
    setAlocacaoDetalhe(null);
    try {
      const res = await fetch(`/api/sec/alocacoes/${alocacaoId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlocacaoDetalhe(data);
    } catch {
      toast("Erro ao carregar alocação.", "error");
    } finally {
      setCarregandoAlocacao(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader
          title="Pendências"
          description="Carregando..."
        />
        <TableSkeleton />
      </PageMotion>
    );
  }

  const tudoEmOrdem = pendencias.length === 0 && !hasFilters;

  return (
    <PageMotion>
      <PageHeader
        title="Pendências"
        description="Itens que requerem atenção da equipe de TI."
      />

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8 min-w-0">
        {KPI_CONFIG.map(({ tipo, icon, iconClassName }, index) => (
          <button
            key={tipo}
            type="button"
            onClick={() => setTipoFiltro(tipo === tipoFiltro ? "todos" : tipo)}
            className="text-left w-full"
            aria-pressed={tipoFiltro === tipo}
          >
            <KpiCard
              label={tipoPendenciaCardLabel(tipo)}
              value={contagemPorTipo[tipo]}
              icon={icon}
              iconClassName={iconClassName}
              index={index}
            />
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Buscar por título ou ID..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={clearFilters}
      >
        <FilterSelect
          value={tipoFiltro}
          onChange={setTipoFiltro}
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Todos os tipos</option>
          {TODOS_TIPOS_PENDENCIA.map((t) => (
            <option key={t} value={t}>
              {tipoPendenciaLabel(t)}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      {tudoEmOrdem ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma pendência encontrada"
            description="Tudo em ordem."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {(hasFilters || filtered.length > 0) && (
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5 sm:px-5">
              <p className="text-xs text-muted-foreground">
                {hasFilters ? (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {filtered.length}
                    </span>{" "}
                    pendência{filtered.length !== 1 ? "s" : ""} encontrada
                    {filtered.length !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {pendencias.length}
                    </span>{" "}
                    pendência{pendencias.length !== 1 ? "s" : ""} aberta
                    {pendencias.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[900px]">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">
                    Tipo
                  </th>
                  <th className={thCompactMid} scope="col">
                    Título
                  </th>
                  <th className={thCompactMid} scope="col">
                    Entidade
                  </th>
                  <th className={thCompactMid} scope="col">
                    ID da entidade
                  </th>
                  <th className={thCompactMid} scope="col">
                    Detectada em
                  </th>
                  <th className={thCompactLast} scope="col">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="Nenhum resultado"
                        description="Tente ajustar a busca ou os filtros."
                        actionLabel="Limpar filtros"
                        onAction={clearFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => {
                    const href = pendenciaRegistroHref(p.entidade, p.entidade_id);
                    return (
                      <tr key={p.pendencia_id} className={trHover}>
                        <td className={tdCompactText}>
                          <Badge variant="outline" className="text-[11px]">
                            {tipoPendenciaLabel(p.tipo)}
                          </Badge>
                        </td>
                        <td className={tdCompactName}>
                          <p className="truncate font-medium text-foreground">
                            {p.titulo}
                          </p>
                          {p.descricao && (
                            <p className="truncate text-xs text-muted-foreground">
                              {p.descricao}
                            </p>
                          )}
                        </td>
                        <td className={tdCompactText}>
                          <span className="text-xs font-medium">{p.entidade}</span>
                        </td>
                        <td className={cn(tdCompactText, "font-mono text-xs")}>
                          <span className="block truncate" title={p.entidade_id}>
                            {p.entidade_id}
                          </span>
                        </td>
                        <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                          {formatDateTime(p.created_at)}
                        </td>
                        <td className={tdCompactActions}>
                          {href ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 text-xs"
                            >
                              <Link href={href}>Ver registro</Link>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => void abrirAlocacao(p.entidade_id)}
                            >
                              Ver registro
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <TablePagination
              totalItems={filtered.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="pendências"
            />
          )}
        </div>
      )}

      {/* Modal alocação (read-only, MVP) */}
      <Dialog
        open={!!alocacaoDetalhe || carregandoAlocacao}
        onOpenChange={(open) => {
          if (!open) {
            setAlocacaoDetalhe(null);
            setCarregandoAlocacao(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhe da alocação</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {carregandoAlocacao ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alocacaoDetalhe ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label="Funcionário"
                  value={alocacaoDetalhe.funcionario_nome}
                />
                <DetailField
                  label="E-mail"
                  value={alocacaoDetalhe.funcionario_email}
                />
                <DetailField
                  label="Equipamento ID"
                  value={alocacaoDetalhe.equipamento_id}
                />
                <DetailField
                  label="Status"
                  value={
                    <Badge variant={statusAlocacaoVariant(alocacaoDetalhe.status)}>
                      {statusAlocacaoLabel(alocacaoDetalhe.status)}
                    </Badge>
                  }
                />
                <DetailField
                  label="Data alocação"
                  value={alocacaoDetalhe.data_alocacao}
                />
                <DetailField
                  label="Devolução prevista"
                  value={alocacaoDetalhe.data_devolucao_prevista}
                />
                {alocacaoDetalhe.observacoes && (
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Observações"
                      value={alocacaoDetalhe.observacoes}
                    />
                  </div>
                )}
                <div className="sm:col-span-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/sec/alocacoes">Ver em Alocações</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
