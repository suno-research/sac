"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Plus, Trash2, Loader2, Shield, SearchX } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const AREAS = ["TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações"];

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];
const MAX_BADGES_VISIBLE = 5;

type SortOrder = "az" | "za" | "mais_ferramentas" | "menos_ferramentas";
type QtdFerramentas = "todos" | "ate_5" | "6_10" | "mais_10";

interface PerfilPadrao {
  id: string;
  cargo: string;
  area: string;
  ferramentaIds: string[];
  descricao: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
  url: string;
  descricao: string;
}

const PERFIL_VAZIO = {
  cargo: "",
  area: "",
  ferramentaIds: [] as string[],
  descricao: "",
};

function PerfisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[320px] rounded-xl bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

function PerfilCard({
  perfil,
  index,
  ferramentas,
  isTI,
  onEdit,
  onDelete,
}: {
  perfil: PerfilPadrao;
  index: number;
  ferramentas: Ferramenta[];
  isTI: boolean;
  onEdit: (p: PerfilPadrao) => void;
  onDelete: (p: PerfilPadrao) => void;
}) {
  const ferrsDoPerfil = perfil.ferramentaIds
    .map((id) => ferramentas.find((f) => f.id === id))
    .filter(Boolean) as Ferramenta[];
  const visiveis = ferrsDoPerfil.slice(0, MAX_BADGES_VISIBLE);
  const restantes = ferrsDoPerfil.length - visiveis.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow duration-200 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8 sm:py-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground tracking-tight sm:text-xl">
            {perfil.cargo}
          </h2>
          <Badge variant="secondary" className="mt-2.5">
            {perfil.area}
          </Badge>
        </div>
        {isTI && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(perfil)} aria-label={`Editar ${perfil.cargo}`}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(perfil)}
              className="text-destructive hover:text-destructive"
              aria-label={`Excluir ${perfil.cargo}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-6 py-6 sm:px-8 sm:py-7">
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {perfil.descricao || "Sem descrição."}
        </p>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ferramentas incluídas
        </p>
        <div className="flex min-h-[2.5rem] flex-1 flex-wrap content-start gap-2">
          {visiveis.map((f) => (
            <Badge
              key={f.id}
              variant={f.tipo === "Passbolt" ? "warning" : "secondary"}
              className="max-w-full truncate px-3 py-1.5 text-xs"
            >
              {f.nome}
            </Badge>
          ))}
          {restantes > 0 && (
            <Badge variant="muted" className="px-3 py-1.5 text-xs">
              +{restantes}
            </Badge>
          )}
          {ferrsDoPerfil.length === 0 && (
            <span className="text-sm text-muted-foreground">Nenhuma ferramenta</span>
          )}
        </div>
        <p className="mt-auto border-t border-border pt-5 text-sm font-medium text-muted-foreground">
          {perfil.ferramentaIds.length} ferramenta{perfil.ferramentaIds.length !== 1 ? "s" : ""} no pacote
        </p>
      </div>
    </motion.article>
  );
}

export default function PerfisPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";

  const [perfis, setPerfis] = useState<PerfilPadrao[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [editando, setEditando] = useState<PerfilPadrao | null>(null);
  const [ferramentasEditando, setFerramentasEditando] = useState<string[]>([]);

  const [modalNovo, setModalNovo] = useState(false);
  const [novoPerfil, setNovoPerfil] = useState(PERFIL_VAZIO);
  const [ferramentasNovo, setFerramentasNovo] = useState<string[]>([]);

  const [modalConfirmDelete, setModalConfirmDelete] = useState(false);
  const [perfilParaExcluir, setPerfilParaExcluir] = useState<PerfilPadrao | null>(null);

  const [busca, setBusca] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("todas");
  const [qtdFerramentas, setQtdFerramentas] = useState<QtdFerramentas>("todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/perfis").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
    ])
      .then(([p, f]) => {
        setPerfis(Array.isArray(p) ? p : []);
        setFerramentas(Array.isArray(f) ? f : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ferramentasPorNome = useMemo(() => {
    const map = new Map(ferramentas.map((f) => [f.id, f.nome]));
    return map;
  }, [ferramentas]);

  const areasDisponiveis = useMemo(
    () =>
      [...new Set(perfis.map((p) => p.area).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [perfis]
  );

  const filtered = useMemo(() => {
    const term = busca.toLowerCase();
    return perfis.filter((p) => {
      const nomesFerramentas = p.ferramentaIds
        .map((id) => ferramentasPorNome.get(id) ?? "")
        .join(" ")
        .toLowerCase();

      const matchBusca =
        !term ||
        p.cargo.toLowerCase().includes(term) ||
        p.area.toLowerCase().includes(term) ||
        p.descricao.toLowerCase().includes(term) ||
        nomesFerramentas.includes(term);

      const matchArea = areaFiltro === "todas" || p.area === areaFiltro;

      const qtd = p.ferramentaIds.length;
      const matchQtd =
        qtdFerramentas === "todos" ||
        (qtdFerramentas === "ate_5" && qtd <= 5) ||
        (qtdFerramentas === "6_10" && qtd >= 6 && qtd <= 10) ||
        (qtdFerramentas === "mais_10" && qtd > 10);

      return matchBusca && matchArea && matchQtd;
    });
  }, [perfis, busca, areaFiltro, qtdFerramentas, ferramentasPorNome]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortOrder === "mais_ferramentas") {
        return b.ferramentaIds.length - a.ferramentaIds.length;
      }
      if (sortOrder === "menos_ferramentas") {
        return a.ferramentaIds.length - b.ferramentaIds.length;
      }
      const cmp = a.cargo.localeCompare(b.cargo, "pt-BR");
      return sortOrder === "az" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortOrder]);

  const paginationKey = `${busca}|${areaFiltro}|${qtdFerramentas}|${pageSize}|${sortOrder}`;
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
      [`${busca}|${areaFiltro}|${qtdFerramentas}|${size}|${sortOrder}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const hasFilters = Boolean(busca || areaFiltro !== "todas" || qtdFerramentas !== "todos");

  const clearFilters = () => {
    setBusca("");
    setAreaFiltro("todas");
    setQtdFerramentas("todos");
  };

  const ferramentasAgrupadas = ferramentas.reduce<Record<string, Ferramenta[]>>((acc, f) => {
    if (!acc[f.categoria]) acc[f.categoria] = [];
    acc[f.categoria].push(f);
    return acc;
  }, {});

  // Criar perfil
  async function criarPerfil() {
    if (!novoPerfil.cargo || !novoPerfil.area) {
      setErro("Cargo e área são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/perfis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...novoPerfil, ferramentaIds: ferramentasNovo }),
      });
      if (!res.ok) throw new Error();
      const criado = await res.json();
      setPerfis((prev) => [...prev, criado]);
      setNovoPerfil(PERFIL_VAZIO);
      setFerramentasNovo([]);
      setModalNovo(false);
      toast("Perfil padrão criado com sucesso.");
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Editar perfil
  function abrirEdicao(perfil: PerfilPadrao) {
    setEditando({ ...perfil });
    setFerramentasEditando([...perfil.ferramentaIds]);
    setErro("");
  }

  async function salvarEdicao() {
    if (!editando || !editando.cargo || !editando.area) {
      setErro("Cargo e área são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/perfis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, ferramentaIds: ferramentasEditando }),
      });
      if (!res.ok) throw new Error();
      const atualizado = await res.json();
      setPerfis((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
      setEditando(null);
      toast("Perfil padrão atualizado com sucesso.");
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Excluir perfil
  function abrirConfirmDelete(perfil: PerfilPadrao) {
    setPerfilParaExcluir(perfil);
    setModalConfirmDelete(true);
  }

  async function excluirPerfil() {
    if (!perfilParaExcluir) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/perfis?id=${perfilParaExcluir.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPerfis((prev) => prev.filter((p) => p.id !== perfilParaExcluir.id));
      setModalConfirmDelete(false);
      toast("Perfil padrão excluído com sucesso.");
    } catch {
      setErro("Erro ao excluir. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function toggleFerramenta(id: string, lista: string[], setLista: (v: string[]) => void) {
    setLista(lista.includes(id) ? lista.filter((i) => i !== id) : [...lista, id]);
  }

  function renderCheckboxes(lista: string[], setLista: (v: string[]) => void) {
    return Object.entries(ferramentasAgrupadas).map(([cat, ferrs]) => (
      <div key={cat} className="rounded-xl border border-border p-5 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{cat}</p>
        <div className="space-y-3">
          {ferrs.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <Checkbox
                id={`chk-${f.id}-${cat}`}
                checked={lista.includes(f.id)}
                onCheckedChange={() => toggleFerramenta(f.id, lista, setLista)}
              />
              <label htmlFor={`chk-${f.id}-${cat}`} className="text-[15px] text-foreground cursor-pointer flex items-center gap-2.5 flex-1">
                {f.nome}
                <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-[10px]">{f.tipo}</Badge>
              </label>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Perfis Padrão" description="Carregando..." />
        <PerfisSkeleton />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Perfis Padrão"
        description="Pacotes de acesso pré-definidos por cargo. Usados no onboarding para agilizar a concessão de ferramentas."
        action={
          isTI ? (
            <Button onClick={() => { setNovoPerfil(PERFIL_VAZIO); setFerramentasNovo([]); setErro(""); setModalNovo(true); }} style={{ background: "#D42126", color: "white" }}>
              <Plus className="h-4 w-4 mr-1" /> Novo perfil
            </Button>
          ) : undefined
        }
      />

      {perfis.length > 0 && (
        <FilterBar
          searchPlaceholder="Buscar por cargo, área, descrição ou ferramenta..."
          searchValue={busca}
          onSearchChange={setBusca}
          showClear={hasFilters}
          onClear={clearFilters}
        >
          <FilterSelect value={areaFiltro} onChange={setAreaFiltro} aria-label="Filtrar por área">
            <option value="todas">Todas as áreas</option>
            {areasDisponiveis.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={qtdFerramentas}
            onChange={(v) => setQtdFerramentas(v as QtdFerramentas)}
            aria-label="Filtrar por quantidade de ferramentas"
          >
            <option value="todos">Todas as quantidades</option>
            <option value="ate_5">Até 5 ferramentas</option>
            <option value="6_10">6 a 10 ferramentas</option>
            <option value="mais_10">Mais de 10 ferramentas</option>
          </FilterSelect>
          <FilterSelect
            value={sortOrder}
            onChange={(v) => setSortOrder(v as SortOrder)}
            aria-label="Ordenar perfis"
          >
            <option value="az">Ordenar: A-Z</option>
            <option value="za">Ordenar: Z-A</option>
            <option value="mais_ferramentas">Mais ferramentas</option>
            <option value="menos_ferramentas">Menos ferramentas</option>
          </FilterSelect>
        </FilterBar>
      )}

      <div className="min-w-0 space-y-8">
        {perfis.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card">
            <EmptyState
              icon={Shield}
              title="Nenhum perfil padrão cadastrado"
              description="Perfis definem pacotes de acesso por cargo e aceleram o onboarding de novos colaboradores."
            />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card">
            <EmptyState
              icon={SearchX}
              title="Nenhum perfil encontrado"
              description="Ajuste os filtros ou limpe a busca para ver mais resultados."
              actionLabel="Limpar filtros"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((perfil, index) => (
              <PerfilCard
                key={perfil.id}
                perfil={perfil}
                index={index}
                ferramentas={ferramentas}
                isTI={isTI}
                onEdit={abrirEdicao}
                onDelete={abrirConfirmDelete}
              />
            ))}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <TablePagination
              totalItems={sorted.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="perfis"
            />
          </div>
        )}
      </div>

      {/* Modal — Novo perfil */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Novo perfil padrão</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Input placeholder="Ex: Analista de Dados" value={novoPerfil.cargo} onChange={(e) => setNovoPerfil((p) => ({ ...p, cargo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={novoPerfil.area} onValueChange={(v) => setNovoPerfil((p) => ({ ...p, area: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descreva o pacote de acesso" value={novoPerfil.descricao} onChange={(e) => setNovoPerfil((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="space-y-4">
              <Label>Ferramentas incluídas ({ferramentasNovo.length} selecionadas)</Label>
              {renderCheckboxes(ferramentasNovo, setFerramentasNovo)}
            </div>
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button disabled={!novoPerfil.cargo || !novoPerfil.area || salvando} onClick={criarPerfil} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar perfil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Editar perfil */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Editar perfil — {editando?.cargo}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Input value={editando?.cargo ?? ""} onChange={(e) => setEditando((p) => (p ? { ...p, cargo: e.target.value } : p))} />
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={editando?.area ?? ""} onValueChange={(v) => setEditando((p) => (p ? { ...p, area: v } : p))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editando?.descricao ?? ""} onChange={(e) => setEditando((p) => (p ? { ...p, descricao: e.target.value } : p))} />
            </div>
            <div className="space-y-4">
              <Label>Ferramentas incluídas ({ferramentasEditando.length} selecionadas)</Label>
              {renderCheckboxes(ferramentasEditando, setFerramentasEditando)}
            </div>
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button disabled={!editando?.cargo || !editando?.area || salvando} onClick={salvarEdicao} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Confirmar exclusão */}
      <Dialog open={modalConfirmDelete} onOpenChange={setModalConfirmDelete}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Excluir perfil</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o perfil <strong className="text-foreground">{perfilParaExcluir?.cargo}</strong>?
              Isso não afeta acessos já concedidos, apenas remove o perfil padrão do onboarding.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfirmDelete(false)}>Cancelar</Button>
            <Button disabled={salvando} onClick={excluirPerfil} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
