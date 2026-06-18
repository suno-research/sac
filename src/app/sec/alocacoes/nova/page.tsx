"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { Alocacao, Ativo, CreateAlocacaoPayload } from "@/types/sec";
import { alocacoesAtivasDoEquipamento } from "@/lib/sec-alocacoes";
import { cn } from "@/lib/utils";

type FormErrors = Partial<
  Record<
    | "equipamento_id"
    | "funcionario_id"
    | "funcionario_nome"
    | "funcionario_email"
    | "data_alocacao"
    | "data_devolucao_prevista",
    string
  >
>;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NovaAlocacaoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [equipamentoBusca, setEquipamentoBusca] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [funcionarioNome, setFuncionarioNome] = useState("");
  const [funcionarioEmail, setFuncionarioEmail] = useState("");
  const [dataAlocacao, setDataAlocacao] = useState(todayISO);
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/alocacoes");
  }, [isTI, status, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/sec/ativos").then((r) => r.json()),
      fetch("/api/sec/alocacoes").then((r) => r.json()),
    ])
      .then(([ativosData, alocacoesData]) => {
        setAtivos(Array.isArray(ativosData) ? ativosData : []);
        setAlocacoes(Array.isArray(alocacoesData) ? alocacoesData : []);
      })
      .catch(() => {
        toast("Erro ao carregar equipamentos.", "error");
      })
      .finally(() => setLoadingDados(false));
  }, [toast]);

  const equipamentosDisponiveis = useMemo(() => {
    return ativos.filter((a) => {
      if (a.status !== "ativo" || a.deleted_at) return false;
      const ativas = alocacoesAtivasDoEquipamento(
        alocacoes,
        a.equipamento_id
      );
      return ativas.length === 0;
    });
  }, [ativos, alocacoes]);

  const equipamentosFiltrados = useMemo(() => {
    const q = equipamentoBusca.toLowerCase().trim();
    if (!q) return equipamentosDisponiveis;
    return equipamentosDisponiveis.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        a.modelo.toLowerCase().includes(q) ||
        a.marca.toLowerCase().includes(q) ||
        a.equipamento_id.toLowerCase().includes(q) ||
        (a.numero_serie?.toLowerCase().includes(q) ?? false)
    );
  }, [equipamentosDisponiveis, equipamentoBusca]);

  const equipamentoSelecionado = useMemo(
    () => equipamentosDisponiveis.find((a) => a.equipamento_id === equipamentoId),
    [equipamentosDisponiveis, equipamentoId]
  );

  function validate(): boolean {
    const next: FormErrors = {};
    if (!equipamentoId) next.equipamento_id = "Selecione um equipamento";
    if (!funcionarioId.trim()) next.funcionario_id = "ID do funcionário é obrigatório";
    if (!funcionarioNome.trim()) next.funcionario_nome = "Nome é obrigatório";
    if (!funcionarioEmail.trim()) {
      next.funcionario_email = "E-mail é obrigatório";
    } else if (!isValidEmail(funcionarioEmail.trim())) {
      next.funcionario_email = "E-mail inválido";
    }
    if (!dataAlocacao) next.data_alocacao = "Data de alocação é obrigatória";
    if (
      dataDevolucaoPrevista &&
      dataAlocacao &&
      dataDevolucaoPrevista < dataAlocacao
    ) {
      next.data_devolucao_prevista =
        "Devolução prevista deve ser igual ou posterior à data de alocação";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSalvando(true);
    try {
      const payload: CreateAlocacaoPayload = {
        equipamento_id: equipamentoId,
        funcionario_id: funcionarioId.trim(),
        funcionario_email: funcionarioEmail.trim(),
        funcionario_nome: funcionarioNome.trim(),
        status: "ativa",
        data_alocacao: dataAlocacao,
      };

      if (dataDevolucaoPrevista) {
        payload.data_devolucao_prevista = dataDevolucaoPrevista;
      }
      if (observacoes.trim()) {
        payload.observacoes = observacoes.trim();
      }

      const res = await fetch("/api/sec/alocacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        toast("Este equipamento já possui uma alocação ativa.", "error");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao registrar alocação");
      }

      toast("Alocação registrada com sucesso.");
      router.push("/sec/alocacoes");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Erro ao registrar alocação.",
        "error"
      );
    } finally {
      setSalvando(false);
    }
  }

  if (status === "loading" || !isTI) {
    return (
      <PageMotion>
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/sec/alocacoes">
            <ArrowLeft className="h-4 w-4" /> Alocações
          </Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">Nova alocação</span>
      </div>

      <PageHeader
        title="Nova alocação"
        description="Registre a entrega de um equipamento a um funcionário."
      />

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Equipamento
            </h2>
            {loadingDados ? (
              <div className="h-24 rounded-xl bg-muted/60 animate-pulse" />
            ) : equipamentosDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum equipamento ativo disponível para alocação.{" "}
                <Link
                  href="/sec/ativos"
                  className="text-blue-500 dark:text-blue-400 underline"
                >
                  Ver ativos
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nome, marca, modelo ou ID..."
                    value={equipamentoBusca}
                    onChange={(e) => setEquipamentoBusca(e.target.value)}
                  />
                </div>

                {equipamentoSelecionado && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-sm dark:border-blue-400/30 dark:bg-blue-400/5">
                    <span className="font-medium text-foreground">
                      Selecionado:{" "}
                    </span>
                    {equipamentoSelecionado.nome} — {equipamentoSelecionado.modelo}
                  </div>
                )}

                <div
                  className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border/40"
                  role="listbox"
                  aria-label="Equipamentos disponíveis"
                >
                  {equipamentosFiltrados.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      Nenhum equipamento encontrado.
                    </p>
                  ) : (
                    equipamentosFiltrados.map((a) => (
                      <button
                        key={a.equipamento_id}
                        type="button"
                        role="option"
                        aria-selected={equipamentoId === a.equipamento_id}
                        onClick={() => setEquipamentoId(a.equipamento_id)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                          equipamentoId === a.equipamento_id &&
                            "bg-blue-500/10 dark:bg-blue-400/10"
                        )}
                      >
                        <p className="font-medium text-foreground truncate">
                          {a.nome}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.marca} {a.modelo}
                          {a.numero_serie ? ` · S/N ${a.numero_serie}` : ""}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                {errors.equipamento_id && (
                  <p className="text-xs text-destructive">{errors.equipamento_id}</p>
                )}
              </div>
            )}
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Funcionário
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Funcionário ID <span className="text-destructive">*</span>
                </label>
                <Input
                  className="mt-1.5"
                  placeholder="ID do funcionário no SAC"
                  value={funcionarioId}
                  onChange={(e) => setFuncionarioId(e.target.value)}
                />
                {errors.funcionario_id && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.funcionario_id}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nome do funcionário <span className="text-destructive">*</span>
                </label>
                <Input
                  className="mt-1.5"
                  placeholder="Nome completo"
                  value={funcionarioNome}
                  onChange={(e) => setFuncionarioNome(e.target.value)}
                />
                {errors.funcionario_nome && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.funcionario_nome}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  E-mail do funcionário <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  className="mt-1.5"
                  placeholder="nome@suno.com.br"
                  value={funcionarioEmail}
                  onChange={(e) => setFuncionarioEmail(e.target.value)}
                />
                {errors.funcionario_email && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.funcionario_email}
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Datas</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Data de alocação <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={dataAlocacao}
                  onChange={(e) => setDataAlocacao(e.target.value)}
                />
                {errors.data_alocacao && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.data_alocacao}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Devolução prevista
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={dataDevolucaoPrevista}
                  onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
                />
                {errors.data_devolucao_prevista && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.data_devolucao_prevista}
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Observações
            </h2>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a entrega..."
            />
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/sec/alocacoes")}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={salvando || equipamentosDisponiveis.length === 0}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Registrar alocação"
            )}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
