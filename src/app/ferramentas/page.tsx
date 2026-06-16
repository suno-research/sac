"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Loader2, SearchX, Wrench } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoriaFerramenta, TipoAcesso, Ferramenta, AcessoFuncionario } from "@/lib/mock-data";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

const categoriasCadastro: CategoriaFerramenta[] = [
  "Comunicação",
  "Analytics",
  "Desenvolvimento",
  "Financeiro",
  "Marketing",
  "Produtividade",
  "Segurança",
  "Infraestrutura",
];

const emojiCategoria: Record<string, string> = {
  Produtividade: "📋",
  Analytics: "📊",
  Desenvolvimento: "💻",
  Financeiro: "💰",
  Marketing: "📣",
  Comunicação: "💬",
  Segurança: "🔐",
  Infraestrutura: "⚙️",
};

function getEmojiCategoria(categoria: string) {
  return emojiCategoria[categoria] ?? "📦";
}

const FERRAMENTA_VAZIA = {
  nome: "",
  categoria: "" as CategoriaFerramenta | "",
  tipo: "" as TipoAcesso | "",
  url: "",
  descricao: "",
};

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 48, background: "#F3F4F6", borderRadius: 8 }} />
      ))}
    </div>
  );
}

export default function FerramentasPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";

  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [acessos, setAcessos] = useState<AcessoFuncionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [tipo, setTipo] = useState<string>("todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalConfirmDelete, setModalConfirmDelete] = useState(false);
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<Ferramenta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [novaFerramenta, setNovaFerramenta] = useState(FERRAMENTA_VAZIA);
  const [ferramentaEditando, setFerramentaEditando] = useState(FERRAMENTA_VAZIA);

  useEffect(() => {
    Promise.all([
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/acessos").then((r) => r.json()),
    ])
      .then(([ferrs, acess]) => {
        setFerramentas(Array.isArray(ferrs) ? ferrs : []);
        setAcessos(Array.isArray(acess) ? acess : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTotalAtivos = (ferramentaId: string) =>
    acessos.filter((a) => a.ferramentaId === ferramentaId && a.status === "Ativo").length;

  const categoriasDisponiveis = useMemo(
    () =>
      [...new Set(ferramentas.map((f) => f.categoria).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [ferramentas]
  );

  const tiposDisponiveis = useMemo(
    () =>
      [...new Set(ferramentas.map((f) => f.tipo).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [ferramentas]
  );

  const filtered = useMemo(() => {
    const term = busca.toLowerCase();
    return ferramentas.filter((f) => {
      const matchBusca =
        !term ||
        f.nome.toLowerCase().includes(term) ||
        f.descricao.toLowerCase().includes(term) ||
        f.url.toLowerCase().includes(term);
      const matchCategoria = categoria === "todas" || f.categoria === categoria;
      const matchTipo = tipo === "todos" || f.tipo === tipo;
      return matchBusca && matchCategoria && matchTipo;
    });
  }, [ferramentas, busca, categoria, tipo]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = a.nome.localeCompare(b.nome, "pt-BR");
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortOrder]);

  const paginationKey = `${busca}|${categoria}|${tipo}|${pageSize}|${sortOrder}`;
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
      [`${busca}|${categoria}|${tipo}|${size}|${sortOrder}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const hasFilters = Boolean(busca || categoria !== "todas" || tipo !== "todos");

  const clearFilters = () => {
    setBusca("");
    setCategoria("todas");
    setTipo("todos");
  };

  async function criarFerramenta() {
    if (!novaFerramenta.nome || !novaFerramenta.categoria || !novaFerramenta.tipo) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/ferramentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaFerramenta),
      });
      if (!res.ok) throw new Error();
      const criada = await res.json();
      setFerramentas((prev) => [...prev, criada]);
      setNovaFerramenta(FERRAMENTA_VAZIA);
      setModalAberto(false);
      toast("Ferramenta criada com sucesso.");
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(f: Ferramenta) {
    setFerramentaSelecionada(f);
    setFerramentaEditando({
      nome: f.nome,
      categoria: f.categoria as CategoriaFerramenta,
      tipo: f.tipo as TipoAcesso,
      url: f.url,
      descricao: f.descricao,
    });
    setErro("");
    setModalEdicao(true);
  }

  async function salvarEdicao() {
    if (!ferramentaEditando.nome || !ferramentaEditando.categoria || !ferramentaEditando.tipo || !ferramentaEditando.url) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/ferramentas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ferramentaSelecionada?.id, ...ferramentaEditando }),
      });
      if (!res.ok) throw new Error();
      const atualizada = await res.json();
      setFerramentas((prev) => prev.map((f) => (f.id === atualizada.id ? atualizada : f)));
      setModalEdicao(false);
      toast("Ferramenta atualizada com sucesso.");
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirConfirmDelete(f: Ferramenta) {
    setFerramentaSelecionada(f);
    setModalConfirmDelete(true);
  }

  async function excluirFerramenta() {
    if (!ferramentaSelecionada) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/ferramentas?id=${ferramentaSelecionada.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setFerramentas((prev) => prev.filter((f) => f.id !== ferramentaSelecionada.id));
      setModalConfirmDelete(false);
      toast("Ferramenta excluída com sucesso.");
    } catch {
      setErro("Erro ao excluir. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Ferramentas" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Ferramentas"
        description={`${ferramentas.length} ferramentas cadastradas`}
        action={
          isTI ? (
            <Button onClick={() => { setNovaFerramenta(FERRAMENTA_VAZIA); setErro(""); setModalAberto(true); }} style={{ background: "#D42126", color: "white" }}>
              <Plus className="h-4 w-4 mr-1" />
              Nova ferramenta
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        searchPlaceholder="Buscar por nome, descrição ou URL..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={clearFilters}
      >
        <FilterSelect
          value={categoria}
          onChange={setCategoria}
          aria-label="Filtrar por categoria"
        >
          <option value="todas">Todas as categorias</option>
          {categoriasDisponiveis.map((c) => (
            <option key={c} value={c}>
              {getEmojiCategoria(c)} {c}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={tipo}
          onChange={setTipo}
          aria-label="Filtrar por tipo de acesso"
        >
          <option value="todos">Todos os tipos</option>
          {tiposDisponiveis.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={sortOrder}
          onChange={(v) => setSortOrder(v as "asc" | "desc")}
          aria-label="Ordenar ferramentas"
        >
          <option value="asc">Ordenar: A-Z</option>
          <option value="desc">Ordenar: Z-A</option>
        </FilterSelect>
      </FilterBar>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden min-w-0">
        <div className="overflow-hidden max-lg:overflow-x-auto">
          <table className="w-full max-w-full table-fixed">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead className="bg-muted/40">
              <tr>
                <th className={thCompactFirst}>Nome</th>
                <th className={thCompactMid}>Categoria</th>
                <th className={thCompactMid}>Tipo de acesso</th>
                <th className={thCompactMid}>URL</th>
                <th className={thCompactMid}>Usuários ativos</th>
                <th className={thCompactLast} />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={hasFilters ? SearchX : Wrench}
                      title={hasFilters ? "Nenhuma ferramenta encontrada" : "Nenhuma ferramenta cadastrada"}
                      description={
                        hasFilters
                          ? "Ajuste os filtros ou limpe a busca para ver mais resultados."
                          : "As ferramentas cadastradas aparecerão nesta lista."
                      }
                      actionLabel={hasFilters ? "Limpar filtros" : undefined}
                      onAction={hasFilters ? clearFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((f) => {
                  const ativos = getTotalAtivos(f.id);
                  return (
                    <tr key={f.id} className={trHover}>
                      <td className={tdCompactName}>
                        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                          <span className="shrink-0 text-lg" aria-hidden>
                            {getEmojiCategoria(f.categoria)}
                          </span>
                          <div className="min-w-0 overflow-hidden">
                            <p className="truncate font-medium text-foreground">{f.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{f.descricao}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCompactText}>
                        <Badge variant="secondary" className="max-w-full truncate text-[11px]">
                          {f.categoria}
                        </Badge>
                      </td>
                      <td className={tdCompactText}>
                        <Badge
                          variant={f.tipo === "Passbolt" ? "warning" : "secondary"}
                          className="max-w-full truncate text-[11px]"
                        >
                          {f.tipo}
                        </Badge>
                      </td>
                      <td className={tdCompactText}>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-muted-foreground hover:text-accent transition-colors"
                        >
                          {f.url.replace(/^https?:\/\//, "")}
                        </a>
                      </td>
                      <td className={`${tdCompactText} font-medium tabular-nums text-foreground`}>
                        {ativos}
                      </td>
                      <td className={tdCompactActions}>
                        {isTI && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => abrirEdicao(f)} aria-label={`Editar ${f.nome}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirConfirmDelete(f)}
                              className="text-destructive hover:text-destructive"
                              aria-label={`Excluir ${f.nome}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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
            itemLabel="ferramentas"
          />
        )}
      </div>

      {/* Modal — Nova ferramenta */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nova ferramenta</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da ferramenta *</Label>
              <Input placeholder="Ex: Jira" value={novaFerramenta.nome} onChange={(e) => setNovaFerramenta((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={novaFerramenta.categoria} onValueChange={(v) => setNovaFerramenta((p) => ({ ...p, categoria: v as CategoriaFerramenta }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categoriasCadastro.map((c) => <SelectItem key={c} value={c}>{getEmojiCategoria(c)} {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de acesso *</Label>
                <Select value={novaFerramenta.tipo} onValueChange={(v) => setNovaFerramenta((p) => ({ ...p, tipo: v as TipoAcesso }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Passbolt">Passbolt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://..." value={novaFerramenta.url} onChange={(e) => setNovaFerramenta((p) => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descreva brevemente a ferramenta" value={novaFerramenta.descricao} onChange={(e) => setNovaFerramenta((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button disabled={!novaFerramenta.nome || !novaFerramenta.categoria || !novaFerramenta.tipo || !novaFerramenta.url || salvando} onClick={criarFerramenta} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar ferramenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Editar ferramenta */}
      <Dialog open={modalEdicao} onOpenChange={setModalEdicao}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar ferramenta</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da ferramenta *</Label>
              <Input placeholder="Ex: Jira" value={ferramentaEditando.nome} onChange={(e) => setFerramentaEditando((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={ferramentaEditando.categoria} onValueChange={(v) => setFerramentaEditando((p) => ({ ...p, categoria: v as CategoriaFerramenta }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categoriasCadastro.map((c) => <SelectItem key={c} value={c}>{getEmojiCategoria(c)} {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de acesso *</Label>
                <Select value={ferramentaEditando.tipo} onValueChange={(v) => setFerramentaEditando((p) => ({ ...p, tipo: v as TipoAcesso }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Passbolt">Passbolt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input placeholder="https://..." value={ferramentaEditando.url} onChange={(e) => setFerramentaEditando((p) => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descreva brevemente a ferramenta" value={ferramentaEditando.descricao} onChange={(e) => setFerramentaEditando((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEdicao(false)}>Cancelar</Button>
            <Button disabled={!ferramentaEditando.nome || !ferramentaEditando.categoria || !ferramentaEditando.tipo || !ferramentaEditando.url || salvando} onClick={salvarEdicao} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Confirmar exclusão */}
      <Dialog open={modalConfirmDelete} onOpenChange={setModalConfirmDelete}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Excluir ferramenta</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{ferramentaSelecionada?.nome}</strong>?
              Esta ação não pode ser desfeita e removerá a ferramenta do catálogo.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfirmDelete(false)}>Cancelar</Button>
            <Button disabled={salvando} onClick={excluirFerramenta} style={{ background: "#D42126", color: "white" }}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
