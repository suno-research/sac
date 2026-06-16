"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, Building2, User, ExternalLink, ClipboardList, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusFuncionarioBadge, StatusAcessoBadge } from "@/components/layout/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { thFirst, thMid, thLast, tdFirst, tdMid, trHover } from "@/lib/table-classes";

type StatusAcesso = "Ativo" | "Pendente concessão" | "Pendente remoção" | "Sem acesso";

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  area: string;
  gestorId: string | null;
  status: "Ativo" | "Desligado";
  dataEntrada: string;
  dataDesligamento?: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
  url: string;
  descricao: string;
}

interface AcessoFuncionario {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: StatusAcesso;
  dataConcessao?: string;
  concedidoPor?: string;
}

interface Offboarding {
  id: string;
  funcionarioId: string;
  status: string;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div style={{ height: 120, background: "#F3F4F6", borderRadius: 16 }} />
      <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} style={{ height: 56, background: "#F3F4F6", borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

export default function FuncionarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isTI = session?.user?.role === "ti";
  const id = params.id as string;

  const [iniciandoOffboarding, setIniciandoOffboarding] = useState(false);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [acessos, setAcessos] = useState<AcessoFuncionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal adicionar acesso
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<string>("");
  const [adicionando, setAdicionando] = useState(false);

  // Modal remover acesso
  const [modalRemover, setModalRemover] = useState(false);
  const [acessoParaRemover, setAcessoParaRemover] = useState<AcessoFuncionario | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const [erro, setErro] = useState("");

  // Modal editar funcionário
  const [modalEditar, setModalEditar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    email: "",
    cargo: "",
    area: "",
    gestorId: "",
    status: "",
    dataEntrada: "",
    dataDesligamento: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/acessos").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/offboardings").then((r) => r.json()),
    ])
      .then(([funcs, acess, ferrs, offs]) => {
        const funcList = Array.isArray(funcs) ? funcs : [];
        const func = funcList.find((f: Funcionario) => f.id === id) || null;
        setFuncionario(func);
        setFuncionarios(funcList);
        setAcessos(
          (Array.isArray(acess) ? acess : []).filter(
            (a: AcessoFuncionario) => a.funcionarioId === id
          )
        );
        setFerramentas(Array.isArray(ferrs) ? ferrs : []);
        setOffboardings(Array.isArray(offs) ? offs : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getFerramentaById = (ferramentaId: string) => ferramentas.find((f) => f.id === ferramentaId);
  const getNomeFuncionario = (funcionarioId: string) =>
    funcionarios.find((f) => f.id === funcionarioId)?.nome ?? "—";

  // Ferramentas que o funcionário ainda não tem acesso ativo
  const ferramentasIds = new Set(acessos.filter(a => a.status === "Ativo").map(a => a.ferramentaId));
  const ferramentasDisponiveis = ferramentas.filter(f => !ferramentasIds.has(f.id));

  async function adicionarAcesso() {
    if (!ferramentaSelecionada || !funcionario) return;
    setErro("");
    setAdicionando(true);
    try {
      const res = await fetch("/api/acessos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionarioId: funcionario.id, ferramentaId: ferramentaSelecionada }),
      });
      if (!res.ok) throw new Error();
      const novo = await res.json();
      setAcessos(prev => [...prev, novo]);
      setFerramentaSelecionada("");
      setModalAdicionar(false);
    } catch {
      setErro("Erro ao adicionar acesso. Tente novamente.");
    } finally {
      setAdicionando(false);
    }
  }

  async function removerAcesso() {
    if (!acessoParaRemover) return;
    setRemovendo(true);
    try {
      const res = await fetch(`/api/acessos?id=${acessoParaRemover.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAcessos(prev => prev.filter(a => a.id !== acessoParaRemover.id));
      setModalRemover(false);
    } catch {
      setErro("Erro ao remover acesso. Tente novamente.");
    } finally {
      setRemovendo(false);
    }
  }

  async function iniciarOffboarding() {
    if (!funcionario) return;
    setIniciandoOffboarding(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const offId = `off${Date.now()}`;
      const responsavelId = session?.user?.email || "";
      await fetch("/api/offboardings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offId, funcionarioId: funcionario.id, dataDesligamento: hoje, dataInicio: hoje, dataConclusao: "", status: "Em andamento", responsavelId }),
      });
      await fetch("/api/acessos/update-batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionarioId: funcionario.id, novoStatus: "Pendente remoção" }),
      });
      await fetch(`/api/funcionarios/${funcionario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Desligado", dataDesligamento: hoje }),
      });
      router.push(`/offboarding/${offId}`);
    } catch (e) {
      console.error("Erro ao iniciar offboarding", e);
    } finally {
      setIniciandoOffboarding(false);
    }
  }

  function abrirModalEditar() {
    if (!funcionario) return;
    setFormEdicao({
      nome: funcionario.nome || "",
      email: funcionario.email || "",
      cargo: funcionario.cargo || "",
      area: funcionario.area || "",
      gestorId: funcionario.gestorId || "",
      status: funcionario.status || "",
      dataEntrada: funcionario.dataEntrada || "",
      dataDesligamento: funcionario.dataDesligamento || "",
    });
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!funcionario) return;
    setEditando(true);
    try {
      const res = await fetch(`/api/funcionarios/${funcionario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formEdicao),
      });
      if (!res.ok) throw new Error();
      setFuncionario({ ...funcionario, ...formEdicao });
      setModalEditar(false);
    } catch {
      setErro("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setEditando(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (!funcionario) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/funcionarios"><ArrowLeft className="h-4 w-4" /> Funcionários</Link>
        </Button>
        <p className="text-muted-foreground">Funcionário não encontrado.</p>
      </div>
    );
  }

  const gestorNome = funcionario.gestorId ? getNomeFuncionario(funcionario.gestorId) : null;
  const offboarding = offboardings.find((o) => o.funcionarioId === funcionario.id);

  const grupos: Record<string, AcessoFuncionario[]> = {
    Ativo: [], "Pendente concessão": [], "Pendente remoção": [], "Sem acesso": [],
  };
  acessos.forEach((a) => grupos[a.status]?.push(a));

  const statsSummary = [
    { label: "Ativos", count: grupos["Ativo"].length, className: "text-success bg-success-muted" },
    { label: "Pend. concessão", count: grupos["Pendente concessão"].length, className: "text-warning bg-warning-muted" },
    { label: "Pend. remoção", count: grupos["Pendente remoção"].length, className: "text-destructive bg-destructive-muted" },
    { label: "Sem acesso", count: grupos["Sem acesso"].length, className: "text-muted-foreground bg-muted" },
  ];

  const ferramentasAgrupadas = ferramentasDisponiveis.reduce<Record<string, Ferramenta[]>>((acc, f) => {
    if (!acc[f.categoria]) acc[f.categoria] = [];
    acc[f.categoria].push(f);
    return acc;
  }, {});

  const funcionarioAtivo = String(funcionario.status).trim() === "Ativo";

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/funcionarios"><ArrowLeft className="h-4 w-4" /> Funcionários</Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">{funcionario.nome}</span>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <Avatar name={funcionario.nome} size="lg" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">{funcionario.nome}</h1>
                <p className="text-[15px] text-muted-foreground mt-1">{funcionario.cargo}</p>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <StatusFuncionarioBadge status={funcionario.status} />
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {funcionario.area}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {funcionario.email}
                  </span>
                  {gestorNome && gestorNome !== "—" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-4 w-4" /> {gestorNome}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Desde{" "}
                    {new Date(funcionario.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isTI && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={abrirModalEditar}
                  className="gap-1.5"
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              )}
              {isTI && funcionario.status === "Ativo" && !offboarding && (
                <Button variant="destructive" size="default" className="gap-2" onClick={iniciarOffboarding} disabled={iniciandoOffboarding}>
                  {iniciandoOffboarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                  Iniciar Offboarding
                </Button>
              )}
              {offboarding && offboarding.status === "Em andamento" && (
                <Button variant="outline" size="default" asChild className="gap-2 border-warning/40 text-warning hover:bg-warning-muted">
                  <Link href={`/offboarding/${offboarding.id}`}><ClipboardList className="h-4 w-4" /> Ver checklist de offboarding</Link>
                </Button>
              )}
              {offboarding && offboarding.status === "Concluído" && (
                <Button variant="outline" size="default" asChild className="gap-2">
                  <Link href={`/offboarding/${offboarding.id}`}><ClipboardList className="h-4 w-4" /> Ver offboarding concluído</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border">
            {statsSummary.map((s) => (
              <div key={s.label} className={`rounded-xl p-5 ${s.className}`}>
                <p className="text-3xl font-semibold tabular-nums">{s.count}</p>
                <p className="text-sm mt-1.5 opacity-90">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ferramentas e acessos ({acessos.length})</CardTitle>
            {isTI && funcionarioAtivo && (
              <Button
                size="sm"
                onClick={() => { setFerramentaSelecionada(""); setErro(""); setModalAdicionar(true); }}
                style={{ background: "#D42126", color: "white" }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Adicionar acesso
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className={thFirst}>Ferramenta</th>
                  <th className={thMid}>Categoria</th>
                  <th className={thMid}>Tipo</th>
                  <th className={thMid}>Status</th>
                  <th className={thMid}>Concessão</th>
                  <th className={thMid}>Concedido por</th>
                  <th
                    className={`${thLast} sticky right-0 z-10 min-w-[4.5rem] bg-muted/40 text-center`}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {acessos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="pl-10 pr-10 py-14 text-center text-[15px] text-muted-foreground">
                      Nenhum acesso cadastrado.
                    </td>
                  </tr>
                ) : (
                  acessos.map((acesso) => {
                    const ferramenta = getFerramentaById(acesso.ferramentaId);
                    const concedidoPorNome = acesso.concedidoPor
                      ? getNomeFuncionario(acesso.concedidoPor) !== "—"
                        ? getNomeFuncionario(acesso.concedidoPor)
                        : acesso.concedidoPor
                      : "—";
                    return (
                      <tr key={acesso.id} className={`group ${trHover}`}>
                        <td className={tdFirst}>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {ferramenta?.nome ?? acesso.ferramentaId}
                            </p>
                            {ferramenta?.url && (
                              <a href={ferramenta.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className={tdMid}>
                          <Badge variant="secondary">{ferramenta?.categoria ?? "—"}</Badge>
                        </td>
                        <td className={tdMid}>
                          <Badge variant={ferramenta?.tipo === "Passbolt" ? "warning" : "secondary"}>
                            {ferramenta?.tipo ?? "—"}
                          </Badge>
                        </td>
                        <td className={tdMid}><StatusAcessoBadge status={acesso.status} /></td>
                        <td className={tdMid}>
                          {acesso.dataConcessao ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className={tdMid}>{concedidoPorNome}</td>
                        <td className="sticky right-0 z-10 min-w-[4.5rem] bg-card group-hover:bg-muted/60 px-3 py-6 text-center border-l border-border/60">
                          {isTI && funcionarioAtivo ? (
                            <button
                              type="button"
                              onClick={() => { setAcessoParaRemover(acesso); setErro(""); setModalRemover(true); }}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                              title="Remover acesso"
                              aria-label={`Remover acesso ${ferramenta?.nome ?? acesso.ferramentaId}`}
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal — Adicionar acesso */}
      <Dialog open={modalAdicionar} onOpenChange={setModalAdicionar}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Adicionar acesso — {funcionario.nome}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {ferramentasDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este funcionário já tem acesso a todas as ferramentas cadastradas.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Selecione a ferramenta para conceder acesso:</p>
                {Object.entries(ferramentasAgrupadas).map(([cat, ferrs]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ferrs.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFerramentaSelecionada(f.id)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all"
                          style={{
                            borderColor: ferramentaSelecionada === f.id ? "#D42126" : "#E5E7EB",
                            background: ferramentaSelecionada === f.id ? "#FEF2F2" : "white",
                            color: ferramentaSelecionada === f.id ? "#D42126" : "#374151",
                          }}
                        >
                          <span className="truncate">{f.nome}</span>
                          <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-[10px] ml-auto flex-shrink-0">{f.tipo}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAdicionar(false)}>Cancelar</Button>
            <Button
              disabled={!ferramentaSelecionada || adicionando}
              onClick={adicionarAcesso}
              style={{ background: "#D42126", color: "white" }}
            >
              {adicionando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conceder acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Confirmar remoção */}
      <Dialog open={modalRemover} onOpenChange={setModalRemover}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remover acesso</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover o acesso de <strong className="text-foreground">{funcionario.nome}</strong> à ferramenta{" "}
              <strong className="text-foreground">{acessoParaRemover ? getFerramentaById(acessoParaRemover.ferramentaId)?.nome : ""}</strong>?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRemover(false)}>Cancelar</Button>
            <Button disabled={removendo} onClick={removerAcesso} style={{ background: "#D42126", color: "white" }}>
              {removendo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Editar funcionário */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Editar funcionário</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nome</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.email}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cargo</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.cargo}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, cargo: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Área</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.area}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, area: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  <option value="TI">TI</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Editorial">Editorial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="RH">RH</option>
                  <option value="Jurídico">Jurídico</option>
                  <option value="Operações">Operações</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Asset">Asset</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Gestor</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.gestorId}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, gestorId: e.target.value }))}
                >
                  <option value="">Sem gestor</option>
                  {funcionarios.filter(f => f.id !== funcionario?.id).map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.status}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Desligado">Desligado</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Data de entrada</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.dataEntrada}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, dataEntrada: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Data de desligamento</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formEdicao.dataDesligamento}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, dataDesligamento: e.target.value }))}
                />
              </div>
            </div>
            {erro && <p className="text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button
              disabled={editando}
              onClick={salvarEdicao}
              style={{ background: "#D42126", color: "white" }}
            >
              {editando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
