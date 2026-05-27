"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
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
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AREAS = ["TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações"];

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
        <div key={i} style={{ height: 280, background: "#F3F4F6", borderRadius: 16 }} />
      ))}
    </div>
  );
}

export default function PerfisPage() {
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

  const getFerramentaById = (id: string) => ferramentas.find((f) => f.id === id);

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
          <Button onClick={() => { setNovoPerfil(PERFIL_VAZIO); setFerramentasNovo([]); setErro(""); setModalNovo(true); }} style={{ background: "#D42126", color: "white" }}>
            <Plus className="h-4 w-4 mr-1" /> Novo perfil
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {perfis.map((perfil, index) => {
          const ferrsDoPerfil = perfil.ferramentaIds.map(getFerramentaById).filter(Boolean);
          return (
            <motion.article
              key={perfil.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col hover:shadow-elevated transition-shadow duration-200"
            >
              <div className="px-8 py-7 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">{perfil.cargo}</h2>
                  <Badge variant="secondary" className="mt-3">{perfil.area}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicao(perfil)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => abrirConfirmDelete(perfil)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="px-8 py-8 flex-1 flex flex-col">
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">{perfil.descricao}</p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ferramentas incluídas</p>
                <div className="flex flex-wrap gap-2.5 flex-1">
                  {ferrsDoPerfil.map((f) => f && (
                    <Badge key={f.id} variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-xs px-3.5 py-1.5">
                      {f.nome}
                    </Badge>
                  ))}
                </div>
                <p className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground font-medium">
                  {perfil.ferramentaIds.length} ferramentas no pacote
                </p>
              </div>
            </motion.article>
          );
        })}
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
