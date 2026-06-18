"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Package,
  SearchX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Plus,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import type { Ativo, ItemEstoque, UnidadeEstoque } from "@/types/sec";
import {
  isEstoqueCritico,
  unidadeLabel,
  TODAS_UNIDADES,
} from "@/lib/sec-estoque";
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
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 50, 100];

type DisponibilidadeFiltro = "todos" | "disponivel" | "critico" | "zerado";
type SortKey = "descricao" | "equipamento" | "disponivel" | "alocado" | "unidade";

function isDisponivelNormal(item: ItemEstoque): boolean {
  if (item.quantidade_disponivel === 0) return false;
  if (item.estoque_minimo !== undefined) {
    return item.quantidade_disponivel > item.estoque_minimo;
  }
  return item.quantidade_disponivel > 0;
}

function qtyColorClass(item: ItemEstoque): string {
  if (item.quantidade_disponivel === 0) return "text-destructive font-semibold";
  if (isEstoqueCritico(item)) return "text-warning font-semibold";
  return "text-foreground";
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground"
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

export default function EstoquePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const router = useRouter();

  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>("todos");
  const [disponibilidadeFiltro, setDisponibilidadeFiltro] =
    useState<DisponibilidadeFiltro>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<SortKey>("descricao");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    Promise.all([
      fetch("/api/sec/estoque").then((r) => r.json()),
      fetch("/api/sec/ativos").then((r) => r.json()),
    ])
      .then(([estoque, ativos]) => {
        setItens(Array.isArray(estoque) ? estoque : []);
        const map: Record<string, string> = {};
        if (Array.isArray(ativos)) {
          (ativos as Ativo[]).forEach((a) => {
            map[a.equipamento_id] = a.nome;
          });
        }
        setAtivosMap(map);
        setLoading(false);
      })
      .catch(() => {
        toast("Erro ao carregar estoque.", "error");
        setLoading(false);
      });
  }, [toast]);

  const kpis = useMemo(() => {
    const criticos = itens.filter((i) => isEstoqueCritico(i)).length;
    const zerados = itens.filter((i) => i.quantidade_disponivel === 0).length;
    return {
      total: itens.length,
      criticos,
      zerados,
    };
  }, [itens]);

  const filtered = useMemo(() => {
    return itens.filter((item) => {
      const q = busca.toLowerCase();
      const nomeEquip = ativosMap[item.equipamento_id]?.toLowerCase() ?? "";
      const matchBusca =
        !q ||
        item.descricao.toLowerCase().includes(q) ||
        item.equipamento_id.toLowerCase().includes(q) ||
        nomeEquip.includes(q);

      const matchUnidade =
        unidadeFiltro === "todos" || item.unidade === unidadeFiltro;

      let matchDisponibilidade = true;
      if (disponibilidadeFiltro === "disponivel") {
        matchDisponibilidade = isDisponivelNormal(item);
      } else if (disponibilidadeFiltro === "critico") {
        matchDisponibilidade =
          isEstoqueCritico(item) && item.quantidade_disponivel > 0;
      } else if (disponibilidadeFiltro === "zerado") {
        matchDisponibilidade = item.quantidade_disponivel === 0;
      }

      return matchBusca && matchUnidade && matchDisponibilidade;
    });
  }, [itens, busca, unidadeFiltro, disponibilidadeFiltro, ativosMap]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "descricao":
          cmp = a.descricao.localeCompare(b.descricao, "pt-BR");
          break;
        case "equipamento": {
          const nomeA = ativosMap[a.equipamento_id] ?? a.equipamento_id;
          const nomeB = ativosMap[b.equipamento_id] ?? b.equipamento_id;
          cmp = nomeA.localeCompare(nomeB, "pt-BR");
          break;
        }
        case "disponivel":
          cmp = a.quantidade_disponivel - b.quantidade_disponivel;
          break;
        case "alocado":
          cmp = a.quantidade_alocada - b.quantidade_alocada;
          break;
        case "unidade":
          cmp = a.unidade.localeCompare(b.unidade, "pt-BR");
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir, ativosMap]);

  const paginationKey = `${busca}|${unidadeFiltro}|${disponibilidadeFiltro}|${pageSize}|${sortKey}|${sortDir}`;
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
      [`${busca}|${unidadeFiltro}|${disponibilidadeFiltro}|${size}`]: 1,
    }));
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

  const hasFilters = Boolean(
    busca || unidadeFiltro !== "todos" || disponibilidadeFiltro !== "todos"
  );

  const clearFilters = () => {
    setBusca("");
    setUnidadeFiltro("todos");
    setDisponibilidadeFiltro("todos");
  };

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Estoque" description="Carregando..." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[180px] rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
        <TableSkeleton />
      </PageMotion>
    );
  }

  const semFiltrosENenhumItem = itens.length === 0 && !hasFilters;

  return (
    <PageMotion>
      <PageHeader
        title="Estoque"
        description="Controle de itens fungíveis e quantidades em pool."
        action={
          isTI ? (
            <Button
              onClick={() => router.push("/sec/estoque/novo")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Novo item
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 xl:gap-8 mb-8">
        <KpiCard
          label="Total de itens"
          value={kpis.total}
          icon={<Package className="h-5 w-5" />}
          iconClassName="text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10"
          index={0}
        />
        <KpiCard
          label="Itens críticos"
          value={kpis.criticos}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClassName="text-warning bg-warning-muted"
          index={1}
        />
        <KpiCard
          label="Itens zerados"
          value={kpis.zerados}
          icon={<PackageX className="h-5 w-5" />}
          iconClassName="text-destructive bg-destructive-muted"
          index={2}
        />
      </div>

      <FilterBar
        searchPlaceholder="Buscar por descrição ou equipamento..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={clearFilters}
      >
        <FilterSelect
          value={unidadeFiltro}
          onChange={setUnidadeFiltro}
          aria-label="Filtrar por unidade"
        >
          <option value="todos">Todas as unidades</option>
          {TODAS_UNIDADES.map((u) => (
            <option key={u} value={u}>
              {unidadeLabel(u)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={disponibilidadeFiltro}
          onChange={(v) => setDisponibilidadeFiltro(v as DisponibilidadeFiltro)}
          aria-label="Filtrar por disponibilidade"
        >
          <option value="todos">Todas as disponibilidades</option>
          <option value="disponivel">Disponível</option>
          <option value="critico">Crítico</option>
          <option value="zerado">Zerado</option>
        </FilterSelect>
      </FilterBar>

      {semFiltrosENenhumItem ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={Package}
            title="Nenhum item no estoque"
            description="Cadastre o primeiro item para começar."
            actionLabel={isTI ? "Novo item" : undefined}
            onAction={isTI ? () => router.push("/sec/estoque/novo") : undefined}
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
                  </>
                ) : (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {itens.length}
                    </span>{" "}
                    item{itens.length !== 1 ? "s" : ""} no estoque
                  </>
                )}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[960px]">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">
                    <SortableHeader
                      label="Descrição"
                      sortKey="descricao"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Equipamento"
                      sortKey="equipamento"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Disponível / Total"
                      sortKey="disponivel"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Alocado"
                      sortKey="alocado"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">
                    <SortableHeader
                      label="Unidade"
                      sortKey="unidade"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid} scope="col">Localização</th>
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
                  paginated.map((item) => (
                    <tr
                      key={item.estoque_id}
                      className={cn(trHover, "cursor-pointer")}
                      onClick={() => router.push(`/sec/estoque/${item.estoque_id}`)}
                    >
                      <td className={tdCompactName}>
                        <p className="truncate font-medium text-foreground">
                          {item.descricao}
                        </p>
                      </td>
                      <td className={tdCompactCargo}>
                        <span
                          className="block truncate"
                          title={ativosMap[item.equipamento_id] ?? item.equipamento_id}
                        >
                          {ativosMap[item.equipamento_id] ?? item.equipamento_id}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-sm")}>
                        <span className={qtyColorClass(item)}>
                          {item.quantidade_disponivel} / {item.quantidade_total}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-sm")}>
                        {item.quantidade_alocada}
                      </td>
                      <td className={tdCompactText}>
                        <span className="text-xs font-medium text-foreground/80">
                          {unidadeLabel(item.unidade as UnidadeEstoque)}
                        </span>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate" title={item.localizacao}>
                          {item.localizacao || "—"}
                        </span>
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
                              href={`/sec/estoque/${item.estoque_id}`}
                              title="Ver detalhe"
                            >
                              <span className="sr-only">
                                Ver detalhe de {item.descricao}
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isTI && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Editar item"
                              aria-label={`Editar ${item.descricao}`}
                              onClick={() =>
                                router.push(
                                  `/sec/estoque/${item.estoque_id}?edit=true`
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
              itemLabel="itens"
            />
          )}
        </div>
      )}
    </PageMotion>
  );
}
