"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Trash2,
  Loader2,
  Monitor,
  SearchX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Plus,
} from "lucide-react";
import type { Ativo, StatusEquipamento } from "@/types/sec";
import {
  tipoLabel,
  statusLabel,
  statusVariant,
  TODOS_TIPOS,
  TODOS_STATUS,
} from "@/lib/sec-ativos";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactName,
  tdCompactText,
  tdCompactCargo,
  tdCompactActions,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = [10, 50, 100];

type StatusAba = StatusEquipamento;
type SortKey = "nome" | "tipo" | "marca" | "status" | "data_aquisicao";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground",
        className
      )}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <Icon className="h-3.5 w-3.5 opacity-60" aria-hidden />
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

const ABAS: { key: StatusAba; label: string }[] = [
  { key: "ativo", label: "Ativos" },
  { key: "inativo", label: "Inativos" },
  { key: "em_manutencao", label: "Em manutenção" },
  { key: "descartado", label: "Descartados" },
];

export default function AtivosPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const router = useRouter();

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<StatusAba>("ativo");
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [modalDescartar, setModalDescartar] = useState(false);
  const [ativoParaDescartar, setAtivoParaDescartar] = useState<Ativo | null>(null);
  const [descartando, setDescartando] = useState(false);

  useEffect(() => {
    fetch("/api/sec/ativos")
      .then((r) => r.json())
      .then((data) => {
        setAtivos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const contagemPorStatus = useMemo(() => {
    const counts: Record<StatusEquipamento, number> = {
      ativo: 0,
      inativo: 0,
      em_manutencao: 0,
      descartado: 0,
    };
    ativos.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  }, [ativos]);

  const listaAtual = useMemo(() => {
    if (statusFiltro !== "todos") {
      return ativos.filter((a) => a.status === statusFiltro);
    }
    return ativos.filter((a) => a.status === aba);
  }, [ativos, aba, statusFiltro]);

  const filtered = useMemo(() => {
    return listaAtual.filter((a) => {
      const q = busca.toLowerCase();
      const matchBusca =
        !q ||
        a.nome.toLowerCase().includes(q) ||
        a.marca.toLowerCase().includes(q) ||
        a.modelo.toLowerCase().includes(q) ||
        (a.numero_serie?.toLowerCase().includes(q) ?? false);
      const matchTipo = tipoFiltro === "todos" || a.tipo === tipoFiltro;
      return matchBusca && matchTipo;
    });
  }, [listaAtual, busca, tipoFiltro]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nome":
          cmp = a.nome.localeCompare(b.nome, "pt-BR");
          break;
        case "tipo":
          cmp = a.tipo.localeCompare(b.tipo, "pt-BR");
          break;
        case "marca":
          cmp = a.marca.localeCompare(b.marca, "pt-BR");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status, "pt-BR");
          break;
        case "data_aquisicao":
          cmp = (a.data_aquisicao ?? "").localeCompare(b.data_aquisicao ?? "");
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const paginationKey = `${aba}|${statusFiltro}|${busca}|${tipoFiltro}|${pageSize}|${sortKey}|${sortDir}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const setCurrentPage = (page: number) => {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageByKey((prev) => ({ ...prev, [`${aba}|${statusFiltro}|${busca}|${tipoFiltro}|${size}`]: 1 }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const hasFilters = Boolean(busca || tipoFiltro !== "todos" || statusFiltro !== "todos");

  const clearFilters = () => {
    setBusca("");
    setTipoFiltro("todos");
    setStatusFiltro("todos");
  };

  async function descartarAtivo() {
    if (!ativoParaDescartar) return;
    setDescartando(true);
    try {
      const res = await fetch(`/api/sec/ativos/${ativoParaDescartar.equipamento_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "descartado" }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAtivos((prev) =>
        prev.map((a) =>
          a.equipamento_id === updated.equipamento_id ? updated : a
        )
      );
      setModalDescartar(false);
      toast("Ativo descartado com sucesso.");
    } catch {
      toast("Erro ao descartar ativo. Tente novamente.", "error");
    } finally {
      setDescartando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Ativos" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  const semFiltrosENenhumAtivo = ativos.length === 0 && !hasFilters;

  return (
    <PageMotion>
      <PageHeader
        title="Ativos"
        description="Catálogo de equipamentos e ativos da empresa."
        action={
          isTI ? (
            <Button
              onClick={() => router.push("/sec/ativos/novo")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Novo ativo
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAba(key);
              setStatusFiltro("todos");
            }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 sm:px-5",
              aba === key && statusFiltro === "todos"
                ? "bg-blue-500 text-white shadow-sm dark:bg-blue-400 dark:text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {label} ({contagemPorStatus[key]})
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Buscar por nome, marca ou modelo..."
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
          {TODOS_TIPOS.map((t) => (
            <option key={t} value={t}>
              {tipoLabel(t)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={statusFiltro}
          onChange={setStatusFiltro}
          aria-label="Filtrar por status"
        >
          <option value="todos">Todos os status</option>
          {TODOS_STATUS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      {semFiltrosENenhumAtivo ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={Monitor}
            title="Nenhum ativo cadastrado"
            description="Cadastre o primeiro equipamento para começar."
            actionLabel={isTI ? "Novo ativo" : undefined}
            onAction={isTI ? () => router.push("/sec/ativos/novo") : undefined}
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
                    resultado{filtered.length !== 1 ? "s" : ""} encontrado
                    {filtered.length !== 1 ? "s" : ""}
                    <span className="hidden sm:inline">
                      {" "}
                      · {listaAtual.length} na aba atual
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {listaAtual.length}
                    </span>{" "}
                    ativo{listaAtual.length !== 1 ? "s" : ""} na lista
                  </>
                )}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[880px]">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">
                    <SortableHeader
                      label="Nome / Modelo"
                      sortKey="nome"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Tipo"
                      sortKey="tipo"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Marca"
                      sortKey="marca"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">Série</th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Aquisição"
                      sortKey="data_aquisicao"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactLast} scope="col">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
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
                  paginated.map((ativo) => (
                    <tr
                      key={ativo.equipamento_id}
                      className={cn(
                        trHover,
                        "cursor-pointer",
                        ativo.status === "descartado" && "opacity-60"
                      )}
                      onClick={() =>
                        router.push(`/sec/ativos/${ativo.equipamento_id}`)
                      }
                    >
                      <td className={tdCompactName}>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {ativo.nome}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {ativo.modelo}
                          </p>
                        </div>
                      </td>
                      <td className={tdCompactText}>
                        <span className="text-xs font-medium text-foreground/80">
                          {tipoLabel(ativo.tipo)}
                        </span>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate" title={ativo.marca}>
                          {ativo.marca}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "text-xs tabular-nums")}>
                        {ativo.numero_serie || "—"}
                      </td>
                      <td className={tdCompactText}>
                        <Badge
                          variant={statusVariant(ativo.status)}
                          className="text-[11px]"
                        >
                          {statusLabel(ativo.status)}
                        </Badge>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {ativo.data_aquisicao
                          ? new Date(
                              ativo.data_aquisicao + "T00:00:00"
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className={tdCompactActions}>
                        <div
                          className="flex items-center justify-end gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 gap-1 px-2 text-xs"
                          >
                            <Link
                              href={`/sec/ativos/${ativo.equipamento_id}`}
                              title="Ver detalhe"
                            >
                              <span className="sr-only">
                                Ver detalhe de {ativo.nome}
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isTI && ativo.status !== "descartado" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Editar ativo"
                                aria-label={`Editar ${ativo.nome}`}
                                onClick={() =>
                                  router.push(
                                    `/sec/ativos/${ativo.equipamento_id}?edit=true`
                                  )
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive-muted hover:text-destructive"
                                title="Descartar ativo"
                                aria-label={`Descartar ${ativo.nome}`}
                                onClick={() => {
                                  setAtivoParaDescartar(ativo);
                                  setModalDescartar(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
              itemLabel="ativos"
            />
          )}
        </div>
      )}

      <Dialog open={modalDescartar} onOpenChange={setModalDescartar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Descartar ativo</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza? O ativo{" "}
              <strong className="text-foreground">
                {ativoParaDescartar?.nome}
              </strong>{" "}
              será marcado como descartado. Esta ação pode ser revertida.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDescartar(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={descartando}
              onClick={descartarAtivo}
            >
              {descartando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Descartar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
