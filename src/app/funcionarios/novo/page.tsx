"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, User, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AREAS = ["TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações"];

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  icone?: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  area: string;
}

interface PerfilPadrao {
  cargo: string;
  ferramentaIds: string[];
}

export default function NovoFuncionarioPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isTI = session?.user?.role === "ti";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [perfis, setPerfis] = useState<PerfilPadrao[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [area, setArea] = useState("");
  const [gestorId, setGestorId] = useState("");
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split("T")[0]);

  const [ferramentasOverrides, setFerramentasOverrides] = useState<string[] | null>(null);
  const [funcionarioId, setFuncionarioId] = useState("");

  const ferramentasSugeridas = useMemo(() => {
    if (!cargo || perfis.length === 0) return [];
    const perfil = perfis.find((p) => p.cargo.toLowerCase() === cargo.toLowerCase());
    return perfil ? perfil.ferramentaIds : [];
  }, [cargo, perfis]);

  const ferramentasSelecionadas = ferramentasOverrides ?? ferramentasSugeridas;

  function handleCargoChange(value: string) {
    setCargo(value);
    setFerramentasOverrides(null);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/perfis").then((r) => r.json()),
    ])
      .then(([ferrs, funcs, prfs]) => {
        setFerramentas(Array.isArray(ferrs) ? ferrs : []);
        setFuncionarios(Array.isArray(funcs) ? funcs : []);
        setPerfis(Array.isArray(prfs) ? prfs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!isTI) {
    return (
      <PageMotion>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">Acesso restrito ao time de TI</p>
          <Button variant="outline" asChild>
            <Link href="/funcionarios">Voltar</Link>
          </Button>
        </div>
      </PageMotion>
    );
  }

  const etapa1Valida = nome && email && cargo && area && dataEntrada;

  async function salvarEtapa1() {
    if (!etapa1Valida) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, cargo, area, gestorId, dataEntrada }),
      });
      if (!res.ok) throw new Error("Erro ao salvar funcionário");
      const data = await res.json();
      setFuncionarioId(data.id);
      setStep(2);
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEtapa2() {
    setSalvando(true);
    try {
      if (ferramentasSelecionadas.length > 0) {
        const res = await fetch("/api/acessos/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ funcionarioId, ferramentaIds: ferramentasSelecionadas }),
        });
        if (!res.ok) throw new Error("Erro ao salvar acessos");
      }
      router.push(`/funcionarios/${funcionarioId}`);
    } catch {
      setErro("Erro ao salvar acessos. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function toggleFerramenta(id: string) {
    const current = ferramentasOverrides ?? ferramentasSugeridas;
    const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id];
    setFerramentasOverrides(next);
  }

  const ferramentasPorCategoria = ferramentas.reduce((acc, f) => {
    const cat = f.categoria || "Outras";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {} as Record<string, Ferramenta[]>);

  if (loading) {
    return (
      <PageMotion>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/funcionarios">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Funcionário</h1>
          <p className="text-sm text-muted-foreground">Cadastro manual de colaborador</p>
        </div>
      </div>

      <div className="flex items-center gap-0 mb-10 max-w-md">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all"
            style={{ background: step >= 1 ? "#D42126" : "#E5E7EB", color: step >= 1 ? "white" : "#6B7280" }}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium" style={{ color: step >= 1 ? "#111827" : "#9CA3AF" }}>
            Dados básicos
          </span>
        </div>
        <div className="flex-1 mx-4 h-px transition-all" style={{ background: step > 1 ? "#D42126" : "#E5E7EB", minWidth: 48 }} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all"
            style={{ background: step >= 2 ? "#D42126" : "#E5E7EB", color: step >= 2 ? "white" : "#6B7280" }}
          >
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium" style={{ color: step >= 2 ? "#111827" : "#9CA3AF" }}>
            Acessos
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="rounded-xl border border-border bg-card shadow-card p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-6">Informações do colaborador</h2>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo <span style={{ color: "#D42126" }}>*</span></label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail corporativo <span style={{ color: "#D42126" }}>*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@suno.com.br" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Cargo <span style={{ color: "#D42126" }}>*</span></label>
                <input type="text" value={cargo} onChange={(e) => handleCargoChange(e.target.value)} placeholder="Ex: Analista de TI" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Área <span style={{ color: "#D42126" }}>*</span></label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all">
                  <option value="">Selecionar...</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Gestor direto</label>
                <select value={gestorId} onChange={(e) => setGestorId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all">
                  <option value="">Sem gestor</option>
                  {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome} — {f.cargo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Data de entrada <span style={{ color: "#D42126" }}>*</span></label>
                <input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>
          {erro && <p className="mt-4 text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          <div className="flex justify-end mt-8">
            <Button onClick={salvarEtapa1} disabled={!etapa1Valida || salvando} style={{ background: "#D42126", color: "white" }} className="gap-2 px-6">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <> Próximo <ArrowRight className="h-4 w-4" /> </>}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-border bg-card shadow-card p-8 max-w-3xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Atribuir acessos</h2>
              <p className="text-sm text-muted-foreground mt-1">Ferramentas pré-selecionadas com base no cargo <strong>{cargo}</strong>. Ajuste conforme necessário.</p>
            </div>
            <Badge variant="secondary">{ferramentasSelecionadas.length} selecionadas</Badge>
          </div>
          {ferramentas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma ferramenta cadastrada.</p>
          ) : (
            <div className="mt-6 space-y-6">
              {Object.entries(ferramentasPorCategoria).map(([categoria, items]) => (
                <div key={categoria}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{categoria}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((f) => {
                      const selecionado = ferramentasSelecionadas.includes(f.id);
                      return (
                        <button key={f.id} type="button" onClick={() => toggleFerramenta(f.id)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all" style={{ borderColor: selecionado ? "#D42126" : "#E5E7EB", background: selecionado ? "#FEF2F2" : "white", color: selecionado ? "#D42126" : "#374151" }}>
                          <div className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all" style={{ borderColor: selecionado ? "#D42126" : "#D1D5DB", background: selecionado ? "#D42126" : "white" }}>
                            {selecionado && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="truncate">{f.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {erro && <p className="mt-4 text-sm font-medium" style={{ color: "#D42126" }}>{erro}</p>}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push(`/funcionarios/${funcionarioId}`)} disabled={salvando}>Pular acessos</Button>
              <Button onClick={salvarEtapa2} disabled={salvando} style={{ background: "#D42126", color: "white" }} className="gap-2 px-6">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Concluir cadastro</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageMotion>
  );
}
