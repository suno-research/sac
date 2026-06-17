"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Package,
  SearchX,
  Plus,
  Pencil,
  AlertTriangle,
  Ban,
} from "lucide-react";
import type { Ativo, ItemEstoque } from "@/types/sec";
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
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 50, 100];

type DisponibilidadeFiltro = "todos" | "disponivel" | "critico" | "zerado";

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

function matchDisponibilidade(
  item: ItemEstoque,
  filtro: DisponibilidadeFiltro
): boolean {
  if (filtro === "todos") return true;
  if (filtro === "zerado") return item.quantidade_disponivel === 0;
  if (filtro === "critico")
    return isEstoqueCritico(item) && item.quantidade_disponivel > 0;
  if (filtro === "disponivel")
    return item.quantidade_disponivel > 0 && !isEstoqueCritico(item);
  return true;
}

function qtyColorClass(item: ItemEstoque): string {
  if (item.quantidade_disponivel === 0) return "text-destructive font-semibold";
  if (isEstoqueCritico(item)) return "text-warning font-semibold";
  return "text-emerald-600 dark:text-emerald-400 font-medium";
}

export default function EstoquePage() {
  const { data: session } = useSession();
  const isTI = session?.user?.role === "ti";
  const router = useRouter();

  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>("todos");
  const [dispFiltro, setDispFiltro] = useState<DisponibilidadeFiltro>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

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
      .catch(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    const critico = itens.filter((i) => isEstoqueCritico(i)).length;
    const zerado = itens.filter((i) => i.quantidade_disponivel === 0).length;
    return { total: itens.length, critico, zerado };
  }, [itens]);

  const filtered = useMemo(() => {
    return itens.filter((item) => {
      const q = busca.toLowerCase();
      const equipNome = ativosMap[item.equipamento_id]?.toLowerCase() ?? "";
      const matchBusca =
        !q ||
        item.descricao.toLowerCase().includes(q) ||
        equipNome.includes(q) ||
        item.equipamento_id.toLowerCase().includes(q);
      const matchUnidade =
        unidadeFiltro === "todos" || item.unidade === unidadeFiltro;
      const matchDisp = matchDisponibilidade(item, dispFiltro);
      return matchBusca && matchUnidade && matchDisp;
    });
  }, [itens, busca, unidadeFiltro, dispFiltro, ativosMap]);

  const paginationKey = `${busca}|${unidadeFiltro}|${dispFiltro}|${pageSize}`;
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
      [`${busca}|${unidadeFiltro}|${dispFiltro}|${size}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const hasFilters =
    Boolean(busca) || unidadeFiltro !== "todos" || dispFiltro !== "todos";

  const clearFilters = () => {
    setBusca("");
    setUnidadeFiltro("todos");
    setDispFiltro("todos");
  };

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Estoque" description="Carregando..." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
        description="Controle de itens e quantidades em estoque."
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
          iconClassName="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
          index={0}
        />
        <KpiCard
          label="Estoque crítico"
          value={kpis.critico}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClassName="text-warning bg-warning-muted"
          index={1}
        />
        <KpiCard
          label="Itens zerados"
          value={kpis.zerado}
          icon={<Ban className="h-5 w-5" />}
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
          value={dispFiltro}
          onChange={(v) => setDispFiltro(v as DisponibilidadeFiltro)}
          aria-label="Filtrar por disponibilidade"
        >
          <option value="todos">Todas disponibilidades</option>
          <option value="disponivel">Disponível</option>
          <option value="critico">Crítico</option>
          <option value="zerado">Zerado</option>
        </FilterSelect>
      </FilterBar>

      {semFiltrosENenhumItem ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={Package}
            title="Nenhum item em estoque"
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
                    item{itens.length !== 1 ? "s" : ""} na lista
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
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">Descrição</th>
                  <th className={thCompactMid} scope="col">Equipamento</th>
                  <th className={thCompactMid} scope="col">Disponível/Total</th>
                  <th className={thCompactMid} scope="col">Alocado</th>
                  <th className={thCompactMid} scope="col">Unidade</th>
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
                      onClick={() =>
                        router.push(`/sec/estoque/${item.estoque_id}`)
                      }
                    >
                      <td className={tdCompactName}>
                        <p className="truncate font-medium text-foreground">
                          {item.descricao}
                        </p>
                      </td>
                      <td className={tdCompactCargo}>
                        <span
                          className="block truncate text-xs"
                          title={ativosMap[item.equipamento_id] ?? item.equipamento_id}
                        >
                          {ativosMap[item.equipamento_id] ?? item.equipamento_id}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-sm")}>
                        <span className={qtyColorClass(item)}>
                          {item.quantidade_disponivel}/{item.quantidade_total}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {item.quantidade_alocada}
                      </td>
                      <td className={tdCompactText}>
                        <span className="text-xs font-medium text-foreground/80">
                          {unidadeLabel(item.unidade)}
                        </span>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate text-xs">
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
