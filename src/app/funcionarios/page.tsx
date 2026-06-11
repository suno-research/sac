"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronRight, Trash2, Loader2 } from "lucide-react";
import type { Funcionario, AreaEmpresa } from "@/lib/mock-data";
import {
  thFirst, thMid, thLast, tdName, tdCargo, tdMid, tdLast, trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
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

  // Modal arquivar
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

  const hasFilters = busca || area !== "todas" || gestor !== "todos";

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

      {/* Abas */}
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

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className={thFirst}>Nome</th>
              <th className={`${thMid} min-w-[220px]`}>Cargo</th>
              <th className={thMid}>Área</th>
              <th className={thMid}>Gestor</th>
              <th className={thMid}>Status</th>
              <th className={thMid}>Entrada</th>
              <th className={thLast} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="pl-10 pr-10 py-14 text-center text-[15px] text-muted-foreground">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((func) => {
                const gestorNome = func.gestorId ? getFuncionarioById(func.gestorId)?.nome : "—";
                return (
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
                    <td className={tdMid}><Badge variant="secondary">{func.area}</Badge></td>
                    <td className={tdMid}>{gestorNome}</td>
                    <td className={tdMid}>
                      <Badge variant={func.status === "Ativo" ? "success" : "muted"}>{func.status}</Badge>
                    </td>
                    <td className={tdMid}>
                      {func.dataEntrada ? new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className={`${tdLast} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/funcionarios/${func.id}`}>
                            Ver acessos <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isTI && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
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
        {filtered.length > 0 && (
          <div className="px-10 py-5 border-t border-border text-sm text-muted-foreground">
            Exibindo {filtered.length} de {listaAtual.length} funcionários
          </div>
        )}
      </div>

      {/* Modal — Confirmar arquivamento */}
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
