"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronRight, Trash2, Loader2 } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";

const areas: AreaEmpresa[] = [
  "TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações",
];

const PAGE_SIZE_OPTIONS = [10, 50, 100];

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 48, background: "#F3F4F6", borderRadius: 8 }} />
      ))}
    </div>
  );
}

export default function FuncionariosPage() {
  const { data: session } = useSession();
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

  const paginationKey = `${aba}|${busca}|${area}|${gestor}|${pageSize}`;
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
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

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
    } catch {
      console.error("Erro ao arquivar");
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
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit border border-border mb-2">
          <button
            onClick={() => setAba("ativos")}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: aba === "ativos" ? "#D42126" : "transparent",
              color: aba === "ativos" ? "white" : "#6B7280",
            }}
          >
            Ativos ({ativos.length})
          </button>
          <button
            onClick={() => setAba("desligados")}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: aba === "desligados" ? "#111827" : "transparent",
              color: aba === "desligados" ? "white" : "#6B7280",
            }}
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
          <FilterSelect value={area} onChange={setArea}>
            <option value="todas">Todas as áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </FilterSelect>
          <FilterSelect value={gestor} onChange={setGestor}>
            <option value="todos">Todos os gestores</option>
            {gestores.map((g) => g && <option key={g.id} value={g.id}>{g.nome}</option>)}
          </FilterSelect>
        </FilterBar>
      )}

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead className="bg-muted/40">
              <tr>
                <th className={thCompactFirst}>Nome</th>
                <th className={thCompactMid}>Cargo</th>
                <th className={thCompactMid}>Área</th>
                <th className={thCompactMid}>Gestor</th>
                <th className={thCompactMid}>Status</th>
                <th className={thCompactMid}>Entrada</th>
                <th className={thCompactLast}>Acessos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-[15px] text-muted-foreground">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              ) : (
                paginated.map((func) => {
                  const gestorNome = func.gestorId ? getFuncionarioById(func.gestorId)?.nome : "—";
                  return (
                    <tr key={func.id} className={trHover}>
                      <td className={tdCompactName}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={func.nome} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{func.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{func.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate" title={func.cargo}>
                          {func.cargo}
                        </span>
                      </td>
                      <td className={tdCompactText}>
                        <Badge variant="secondary" className="max-w-full truncate">
                          {func.area}
                        </Badge>
                      </td>
                      <td className={`${tdCompactText} truncate`} title={gestorNome ?? undefined}>
                        {gestorNome}
                      </td>
                      <td className={tdCompactText}>
                        <Badge variant={func.status === "Ativo" ? "success" : "muted"}>{func.status}</Badge>
                      </td>
                      <td className={tdCompactText}>
                        {func.dataEntrada ? new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className={tdCompactActions}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs">
                            <Link href={`/funcionarios/${func.id}`} title="Ver acessos">
                              <span className="hidden lg:inline">Ver acessos</span>
                              <span className="lg:hidden">Acessos</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {isTI && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Arquivar funcionário"
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
