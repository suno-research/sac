"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { filterAcessosByRole } from "@/lib/acessos-scope";
import { formatOrigemAcesso, daysSinceDate } from "@/lib/governance";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactName,
  tdCompactText,
  tdCompactActions,
  trHover,
} from "@/lib/table-classes";

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

type SortOrder = "recentes" | "antigas" | "dias_aberto";
type TipoPendencia = "todos" | "concessao" | "remocao";
type DiasFiltro = "todos" | "ate_7" | "mais_7";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  email?: string;
  gestorId?: string | null;
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
  origem: string;
  dias: number | null;
}

function SkeletonSection() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

function PendenciaRow({
  item,
  isTI,
  resolvendo,
  onResolver,
}: {
  item: PendenciaItem;
  isTI: boolean;
  resolvendo: string | null;
  onResolver: (acessoId: string, novoStatus: string) => void;
}) {
  const { acesso, funcionario, ferramenta, origem, dias } = item;
  const isRemocao = acesso.status === "Pendente remoção";

  return (
    <tr className={trHover}>
      <td className={tdCompactName}>
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <Avatar name={funcionario?.nome || "?"} size="md" className="shrink-0" />
          <div className="min-w-0 overflow-hidden">
            <p className="truncate font-medium text-foreground text-sm">
              {funcionario?.nome || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{funcionario?.cargo}</p>
          </div>
        </div>
      </td>
      <td className={tdCompactText}>
        <p className="truncate font-medium text-sm text-foreground">{ferramenta?.nome || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{ferramenta?.categoria}</p>
      </td>
      <td className={tdCompactText}>
        <Badge variant={isRemocao ? "destructive" : "warning"} className="text-[11px]">
          {isRemocao ? "Remoção" : "Concessão"}
        </Badge>
      </td>
      <td className={tdCompactText}>
        <span className="block truncate text-sm">{origem}</span>
      </td>
      <td className={`${tdCompactText} tabular-nums text-xs`}>
        {acesso.dataConcessao
          ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR")
          : "—"}
      </td>
      <td className={tdCompactText}>
        {dias !== null ? (
          <Badge variant={dias > 7 ? "destructive" : dias > 3 ? "warning" : "secondary"}>
            {dias}d
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className={tdCompactText}>
        <Badge variant="secondary" className="max-w-full truncate text-[11px]">
          {funcionario?.area || "—"}
        </Badge>
      </td>
      <td className={tdCompactText}>
        <Badge
          variant={ferramenta?.tipo === "Passbolt" ? "warning" : "secondary"}
          className="max-w-full truncate text-[11px]"
        >
          {ferramenta?.tipo || "—"}
        </Badge>
      </td>
      <td className={tdCompactActions}>
        <div className="flex items-center justify-end gap-1">
          {isTI && (
            <Button
              size="sm"
              onClick={() =>
                onResolver(acesso.id, isRemocao ? "Sem acesso" : "Ativo")
              }
              disabled={resolvendo === acesso.id}
              style={isRemocao ? { background: "#D42126", color: "white" } : undefined}
              className={
                isRemocao
                  ? "gap-1.5"
                  : "gap-1.5 bg-success hover:opacity-90 text-white"
              }
            >
              {resolvendo === acesso.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden xl:inline">
                {isRemocao ? "Confirmar remoção" : "Confirmar concessão"}
              </span>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/funcionarios/${acesso.funcionarioId}`} aria-label="Ver funcionário">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function PendenciasPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const userEmail = session?.user?.email ?? "";
  const role = session?.user?.role ?? "user";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvendo, setResolvendo] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [tipoPendencia, setTipoPendencia] = useState<TipoPendencia>("todos");
  const [origem, setOrigem] = useState("todas");
  const [area, setArea] = useState("todas");
  const [diasFiltro, setDiasFiltro] = useState<DiasFiltro>("todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recentes");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

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

  const getFuncionario = useMemo(() => {
    const map = new Map(funcionarios.map((f) => [f.id, f]));
    return (id: string) => map.get(id);
  }, [funcionarios]);

  const getFerramenta = useMemo(() => {
    const map = new Map(ferramentas.map((f) => [f.id, f]));
    return (id: string) => map.get(id);
  }, [ferramentas]);

  const acessosNoEscopo = useMemo(
    () => filterAcessosByRole(acessos, funcionarios, role, userEmail),
    [acessos, funcionarios, role, userEmail]
  );

  const todasPendencias: PendenciaItem[] = useMemo(
    () =>
      acessosNoEscopo
        .filter(
          (a) => a.status === "Pendente concessão" || a.status === "Pendente remoção"
        )
        .map((a) => ({
          acesso: a,
          funcionario: getFuncionario(a.funcionarioId),
          ferramenta: getFerramenta(a.ferramentaId),
          origem: formatOrigemAcesso(a.concedidoPor),
          dias: daysSinceDate(a.dataConcessao),
        })),
    [acessosNoEscopo, getFuncionario, getFerramenta]
  );

  const origensDisponiveis = useMemo(
    () =>
      [...new Set(todasPendencias.map((p) => p.origem).filter((o) => o !== "—"))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [todasPendencias]
  );

  const areasDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          todasPendencias.map((p) => p.funcionario?.area).filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [todasPendencias]
  );

  const filtered = useMemo(() => {
    const term = busca.toLowerCase();
    return todasPendencias.filter((p) => {
      const matchBusca =
        !term ||
        p.funcionario?.nome.toLowerCase().includes(term) ||
        p.funcionario?.cargo.toLowerCase().includes(term) ||
        p.ferramenta?.nome.toLowerCase().includes(term) ||
        p.ferramenta?.categoria.toLowerCase().includes(term);

      const matchTipo =
        tipoPendencia === "todos" ||
        (tipoPendencia === "concessao" && p.acesso.status === "Pendente concessão") ||
        (tipoPendencia === "remocao" && p.acesso.status === "Pendente remoção");

      const matchOrigem = origem === "todas" || p.origem === origem;
      const matchArea = area === "todas" || p.funcionario?.area === area;

      const matchDias =
        diasFiltro === "todos" ||
        (diasFiltro === "ate_7" && (p.dias === null || p.dias <= 7)) ||
        (diasFiltro === "mais_7" && p.dias !== null && p.dias > 7);

      return matchBusca && matchTipo && matchOrigem && matchArea && matchDias;
    });
  }, [todasPendencias, busca, tipoPendencia, origem, area, diasFiltro]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortOrder === "dias_aberto") {
        const da = a.dias ?? -1;
        const db = b.dias ?? -1;
        return db - da;
      }
      const dateA = a.acesso.dataConcessao || "";
      const dateB = b.acesso.dataConcessao || "";
      if (sortOrder === "recentes") return dateB.localeCompare(dateA);
      return dateA.localeCompare(dateB);
    });
    return list;
  }, [filtered, sortOrder]);

  const paginationKey = `${busca}|${tipoPendencia}|${origem}|${area}|${diasFiltro}|${pageSize}|${sortOrder}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const setCurrentPage = (page: number) => {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageByKey((prev) => ({
      ...prev,
      [`${busca}|${tipoPendencia}|${origem}|${area}|${diasFiltro}|${size}|${sortOrder}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const hasFilters = Boolean(
    busca || tipoPendencia !== "todos" || origem !== "todas" || area !== "todas" || diasFiltro !== "todos"
  );

  const clearFilters = () => {
    setBusca("");
    setTipoPendencia("todos");
    setOrigem("todas");
    setArea("todas");
    setDiasFiltro("todos");
  };

  const countRemocao = todasPendencias.filter(
    (p) => p.acesso.status === "Pendente remoção"
  ).length;
  const countConcessao = todasPendencias.filter(
    (p) => p.acesso.status === "Pendente concessão"
  ).length;

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

  return (
    <PageMotion>
      <PageHeader
        title="Pendências"
        description={
          todasPendencias.length === 0
            ? "Nenhuma pendência no momento"
            : `${todasPendencias.length} pendência${todasPendencias.length > 1 ? "s" : ""} aguardando resolução`
        }
      />

      {todasPendencias.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma pendência no momento"
            description="Todas as pendências foram resolvidas."
          />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <Badge variant="destructive">{countRemocao} remoção</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <Badge variant="warning">{countConcessao} concessão</Badge>
            </div>
          </div>

          <FilterBar
            searchPlaceholder="Buscar funcionário ou ferramenta..."
            searchValue={busca}
            onSearchChange={setBusca}
            showClear={hasFilters}
            onClear={clearFilters}
          >
            <FilterSelect
              value={tipoPendencia}
              onChange={(v) => setTipoPendencia(v as TipoPendencia)}
              aria-label="Filtrar por tipo de pendência"
            >
              <option value="todos">Todos os tipos</option>
              <option value="concessao">Concessão</option>
              <option value="remocao">Remoção</option>
            </FilterSelect>
            <FilterSelect
              value={origem}
              onChange={setOrigem}
              aria-label="Filtrar por origem"
            >
              <option value="todas">Todas as origens</option>
              {origensDisponiveis.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={area} onChange={setArea} aria-label="Filtrar por área">
              <option value="todas">Todas as áreas</option>
              {areasDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={diasFiltro}
              onChange={(v) => setDiasFiltro(v as DiasFiltro)}
              aria-label="Filtrar por dias em aberto"
            >
              <option value="todos">Todos os prazos</option>
              <option value="ate_7">Até 7 dias</option>
              <option value="mais_7">Mais de 7 dias</option>
            </FilterSelect>
            <FilterSelect
              value={sortOrder}
              onChange={(v) => setSortOrder(v as SortOrder)}
              aria-label="Ordenar pendências"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="dias_aberto">Mais dias em aberto</option>
            </FilterSelect>
          </FilterBar>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden min-w-0">
            <div className="overflow-hidden max-lg:overflow-x-auto">
              <table className="w-full max-w-full table-fixed min-w-[960px] lg:min-w-0">
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead className="bg-muted/40">
                  <tr>
                    <th className={thCompactFirst}>Funcionário</th>
                    <th className={thCompactMid}>Ferramenta</th>
                    <th className={thCompactMid}>Pendência</th>
                    <th className={thCompactMid}>Origem</th>
                    <th className={thCompactMid}>Data</th>
                    <th className={thCompactMid}>Dias</th>
                    <th className={thCompactMid}>Área</th>
                    <th className={thCompactMid}>Tipo</th>
                    <th className={thCompactLast}>Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <EmptyState
                          icon={SearchX}
                          title="Nenhuma pendência encontrada"
                          description="Ajuste os filtros ou limpe a busca para ver mais resultados."
                          actionLabel="Limpar filtros"
                          onAction={clearFilters}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item) => (
                      <PendenciaRow
                        key={item.acesso.id}
                        item={item}
                        isTI={isTI}
                        resolvendo={resolvendo}
                        onResolver={resolverAcesso}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {sorted.length > 0 && (
              <TablePagination
                totalItems={sorted.length}
                currentPage={safePage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                itemLabel="pendências"
              />
            )}
          </div>
        </>
      )}
    </PageMotion>
  );
}
