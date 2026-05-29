"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
  thFirst,
  thMid,
  thLast,
  tdName,
  tdMid,
  tdLast,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categorias: CategoriaFerramenta[] = [
  "Comunicação",
  "Analytics",
  "Desenvolvimento",
  "Financeiro",
  "Marketing",
  "Produtividade",
  "Segurança",
  "Infraestrutura",
];

const emojiCategoria: Record<CategoriaFerramenta, string> = {
  Produtividade: "📋",
  Analytics: "📊",
  Desenvolvimento: "💻",
  Financeiro: "💰",
  Marketing: "📣",
  Comunicação: "💬",
  Segurança: "🔐",
  Infraestrutura: "⚙️",
};

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
  const isTI = session?.user?.role === "ti";

  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [acessos, setAcessos] = useState<AcessoFuncionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [tipo, setTipo] = useState<string>("todos");

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

  const filtered = ferramentas.filter((f) => {
    const matchBusca =
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoria === "todas" || f.categoria === categoria;
    const matchTipo = tipo === "todos" || f.tipo === tipo;
    return matchBusca && matchCategoria && matchTipo;
  });

  const hasFilters = busca || categoria !== "todas" || tipo !== "todos";

  async function criarFerramenta() {
    if (!novaFerramenta.nome || !novaFerramenta.categoria || !novaFerramenta.tipo || !novaFerramenta.url) {
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
        searchPlaceholder="Buscar ferramenta..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={() => { setBusca(""); setCategoria("todas"); setTipo("todos"); }}
      >
        <FilterSelect value={categoria} onChange={setCategoria}>
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{emojiCategoria[c]} {c}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={tipo} onChange={setTipo}>
          <option value="todos">Todos os tipos</option>
          <option value="Individual">Individual</option>
          <option value="Passbolt">Passbolt</option>
        </FilterSelect>
      </FilterBar>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className={thFirst}>Nome</th>
              <th className={thMid}>Categoria</th>
              <th className={thMid}>Tipo de acesso</th>
              <th className={thMid}>URL</th>
              <th className={thMid}>Usuários ativos</th>
              <th className={thLast} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="pl-10 pr-10 py-14 text-center text-[15px] text-muted-foreground">
                  Nenhuma ferramenta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const ativos = getTotalAtivos(f.id);
                return (
                  <tr key={f.id} className={trHover}>
                    <td className={tdName}>
                      <div className="flex items-center gap-4">
                        <span className="text-xl flex-shrink-0" aria-hidden>
                          {emojiCategoria[f.categoria as CategoriaFerramenta] ?? "📦"}
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.descricao}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdMid}><Badge variant="secondary">{f.categoria}</Badge></td>
                    <td className={tdMid}><Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"}>{f.tipo}</Badge></td>
                    <td className="px-8 py-6 text-[15px] min-w-[240px]">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                        {f.url.replace("https://", "")}
                      </a>
                    </td>
                    <td className={`${tdMid} font-medium text-foreground tabular-nums`}>{ativos}</td>
                    <td className={`${tdLast} text-right`}>
                      {isTI && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => abrirEdicao(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => abrirConfirmDelete(f)} className="text-destructive hover:text-destructive">
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
        {filtered.length > 0 && (
          <div className="px-10 py-5 border-t border-border text-sm text-muted-foreground">
            Exibindo {filtered.length} de {ferramentas.length} ferramentas
          </div>
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
                    {categorias.map((c) => <SelectItem key={c} value={c}>{emojiCategoria[c]} {c}</SelectItem>)}
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
              <Label>URL *</Label>
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
                    {categorias.map((c) => <SelectItem key={c} value={c}>{emojiCategoria[c]} {c}</SelectItem>)}
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
