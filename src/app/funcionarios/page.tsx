"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronRight, Trash2, Loader2, Users, SearchX, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { Funcionario, AreaEmpresa } from "@/lib/mock-data";
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
import { Avatar } from "@/components/ui/avatar";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";

const areas: AreaEmpresa[] = [
  "TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações",
];

const PAGE_SIZE_OPTIONS = [10, 50, 100];

type SortKey = "nome" | "cargo" | "area" | "gestor" | "status" | "dataEntrada";

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
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyTableState({
  hasFilters,
  aba,
  onClearFilters,
}: {
  hasFilters: boolean;
  aba: "ativos" | "desligados";
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {hasFilters ? (
        <SearchX className="mb-4 h-10 w-10 text-muted-foreground/40" aria-hidden />
      ) : (
        <Users className="mb-4 h-10 w-10 text-muted-foreground/40" aria-hidden />
      )}
      <p className="text-sm font-medium text-foreground">
        {hasFilters
          ? "Nenhum resultado para os filtros aplicados"
          : aba === "ativos"
            ? "Nenhum funcionário ativo nesta lista"
            : "Nenhum funcionário desligado nesta lista"}
      </p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Tente ajustar a busca ou remover alguns filtros."
          : "Os registros aparecerão aqui quando forem cadastrados."}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-5">
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

export default function FuncionariosPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isGestor = session?.user?.role === "gestor";
  const isUser = session?.user?.role === "user";
  const isTI = session?.user?.role === "ti";
  const router = useRouter();
  const userEmail = session?.user?.email || "";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"ativos" | "desligados">("ativos");
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [gestor, setGestor] = useState<string>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [modalArquivar, setModalArquivar] = useState(false);
  const [funcParaArquivar, setFuncParaArquivar] = useState<Funcionario | null>(null);
  const [arquivando, setArquivando] = useState(false);

  useEffect(() => {
    fetch("/api/funcionarios")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as Funcionario[]) : [];
        const ativos = list.filter((f) => f.status !== "Arquivado");
        if (isGestor) {
          const gestorRecord = ativos.find((f) => f.email === userEmail);
          if (gestorRecord) {
            setFuncionarios(ativos.filter((f) => f.gestorId === gestorRecord.id));
          } else {
            setFuncionarios([]);
          }
        } else if (isUser) {
          setFuncionarios(ativos.filter((f) => f.email === userEmail));
        } else {
          setFuncionarios(ativos);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isGestor, isUser, userEmail]);

  const getFuncionarioById = useMemo(() => {
    const map = new Map(funcionarios.map((f) => [f.id, f]));
    return (id: string) => map.get(id);
  }, [funcionarios]);

  const gestores = useMemo(() => {
    const ids = [...new Set(funcionarios.map((f) => f.gestorId).filter(Boolean))] as string[];
    return ids.map((id) => getFuncionarioById(id)).filter(Boolean);
  }, [funcionarios, getFuncionarioById]);

  const ativos = useMemo(() => funcionarios.filter((f) => f.status === "Ativo"), [funcionarios]);
  const desligados = useMemo(() => funcionarios.filter((f) => f.status === "Desligado"), [funcionarios]);
  const listaAtual = aba === "ativos" ? ativos : desligados;

  const filtered = useMemo(() => {
    return listaAtual.filter((f) => {
      const matchBusca =
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.email.toLowerCase().includes(busca.toLowerCase());
      const matchArea = area === "todas" || f.area === area;
      const matchGestor = gestor === "todos" || f.gestorId === gestor;
      return matchBusca && matchArea && matchGestor;
    });
  }, [listaAtual, busca, area, gestor]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nome":
          cmp = a.nome.localeCompare(b.nome, "pt-BR");
          break;
        case "cargo":
          cmp = a.cargo.localeCompare(b.cargo, "pt-BR");
          break;
        case "area":
          cmp = a.area.localeCompare(b.area, "pt-BR");
          break;
        case "gestor": {
          const ga = a.gestorId ? getFuncionarioById(a.gestorId)?.nome ?? "" : "";
          const gb = b.gestorId ? getFuncionarioById(b.gestorId)?.nome ?? "" : "";
          cmp = ga.localeCompare(gb, "pt-BR");
          break;
        }
        case "status":
          cmp = a.status.localeCompare(b.status, "pt-BR");
          break;
        case "dataEntrada":
          cmp = (a.dataEntrada ?? "").localeCompare(b.dataEntrada ?? "");
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir, getFuncionarioById]);

  const paginationKey = `${aba}|${busca}|${area}|${gestor}|${pageSize}|${sortKey}|${sortDir}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const setCurrentPage = (page: number) => {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageByKey((prev) => ({ ...prev, [`${aba}|${busca}|${area}|${gestor}|${size}`]: 1 }));
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

  const hasFilters = Boolean(busca || area !== "todas" || gestor !== "todos");

  const clearFilters = () => {
    setBusca("");
    setArea("todas");
    setGestor("todos");
  };

  async function arquivarFuncionario() {
    if (!funcParaArquivar) return;
    setArquivando(true);
    try {
      const res = await fetch("/api/funcionarios/arquivar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: funcParaArquivar.id }),
      });
      if (!res.ok) throw new Error();
      setFuncionarios((prev) => prev.filter((f) => f.id !== funcParaArquivar.id));
      setModalArquivar(false);
      toast("Funcionário arquivado com sucesso.");
    } catch {
      toast("Erro ao arquivar funcionário.", "error");
    } finally {
      setArquivando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Funcionários" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Funcionários"
        description={isGestor ? `${funcionarios.length} membros do seu time` : `${funcionarios.length} funcionários cadastrados`}
        action={isTI ? (
          <Button onClick={() => router.push("/funcionarios/novo")} style={{ background: "#D42126", color: "white" }} className="gap-2">
            + Novo Funcionário
          </Button>
        ) : undefined}
      />

      {!isGestor && !isUser && (
        <div className="mb-4 flex w-fit gap-1 rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setAba("ativos")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150",
              aba === "ativos"
                ? "bg-accent text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Ativos ({ativos.length})
          </button>
          <button
            type="button"
            onClick={() => setAba("desligados")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150",
              aba === "desligados"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Desligados ({desligados.length})
          </button>
        </div>
      )}

      {(isTI || isGestor) && (
        <FilterBar
          searchPlaceholder="Buscar por nome ou email..."
          searchValue={busca}
          onSearchChange={setBusca}
          showClear={hasFilters}
          onClear={clearFilters}
        >
          <FilterSelect value={area} onChange={setArea} aria-label="Filtrar por área">
            <option value="todas">Todas as áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </FilterSelect>
          <FilterSelect value={gestor} onChange={setGestor} aria-label="Filtrar por gestor">
            <option value="todos">Todos os gestores</option>
            {gestores.map((g) => g && <option key={g.id} value={g.id}>{g.nome}</option>)}
          </FilterSelect>
        </FilterBar>
      )}

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {(hasFilters || filtered.length > 0) && (
          <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5 sm:px-5">
            <p className="text-xs text-muted-foreground">
              {hasFilters ? (
                <>
                  <span className="font-medium tabular-nums text-foreground">{filtered.length}</span>
                  {" "}resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
                  <span className="hidden sm:inline"> · {listaAtual.length} na aba atual</span>
                </>
              ) : (
                <>
                  <span className="font-medium tabular-nums text-foreground">{listaAtual.length}</span>
                  {" "}funcionário{listaAtual.length !== 1 ? "s" : ""} na lista
                </>
              )}
            </p>
          </div>
        )}

        <div className="overflow-x-auto md:overflow-x-visible">
          <table className="w-full table-fixed md:min-w-0 min-w-[880px]">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead className="bg-muted/40">
              <tr>
                <th className={thCompactFirst} scope="col">
                  <SortableHeader label="Nome" sortKey="nome" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactMid} scope="col">
                  <SortableHeader label="Cargo" sortKey="cargo" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactMid} scope="col">
                  <SortableHeader label="Área" sortKey="area" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactMid} scope="col">
                  <SortableHeader label="Gestor" sortKey="gestor" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactMid} scope="col">
                  <SortableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactMid} scope="col">
                  <SortableHeader label="Entrada" sortKey="dataEntrada" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className={thCompactLast} scope="col">Acessos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyTableState
                      hasFilters={hasFilters}
                      aba={aba}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((func) => {
                  const gestorNome = func.gestorId ? getFuncionarioById(func.gestorId)?.nome : "—";
                  return (
                    <tr key={func.id} className={trHover}>
                      <td className={tdCompactName}>
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          <Avatar name={func.nome} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{func.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{func.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate" title={func.cargo}>
                          {func.cargo}
                        </span>
                      </td>
                      <td className={tdCompactText}>
                        <span className="block truncate text-xs font-medium text-foreground/80" title={func.area}>
                          {func.area}
                        </span>
                      </td>
                      <td className={tdCompactText}>
                        <span className="block truncate" title={gestorNome ?? undefined}>
                          {gestorNome}
                        </span>
                      </td>
                      <td className={tdCompactText}>
                        <Badge variant={func.status === "Ativo" ? "success" : "muted"} className="text-[11px]">
                          {func.status}
                        </Badge>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {func.dataEntrada
                          ? new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className={tdCompactActions}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" asChild className="h-8 gap-1 px-2 text-xs">
                            <Link href={`/funcionarios/${func.id}`} title="Ver acessos">
                              <span className="sr-only">Ver acessos de {func.nome}</span>
                              <span className="hidden xl:inline">Acessos</span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isTI && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive-muted hover:text-destructive"
                              title="Arquivar funcionário"
                              aria-label={`Arquivar ${func.nome}`}
                              onClick={() => { setFuncParaArquivar(func); setModalArquivar(true); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
            itemLabel="funcionários"
          />
        )}
      </div>

      <Dialog open={modalArquivar} onOpenChange={setModalArquivar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Arquivar funcionário</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja arquivar <strong className="text-foreground">{funcParaArquivar?.nome}</strong>?
              O funcionário não aparecerá mais na lista mas o histórico será mantido.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalArquivar(false)}>Cancelar</Button>
            <Button disabled={arquivando} onClick={arquivarFuncionario} style={{ background: "#D42126", color: "white" }}>
              {arquivando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, arquivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
