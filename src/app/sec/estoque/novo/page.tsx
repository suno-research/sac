"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Ativo, CreateEstoquePayload, UnidadeEstoque } from "@/types/sec";
import { unidadeLabel, TODAS_UNIDADES } from "@/lib/sec-estoque";

type FormErrors = Partial<Record<keyof CreateEstoquePayload, string>>;

export default function NovoEstoquePage() {
  return (
    <Suspense
      fallback={
        <PageMotion>
          <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
        </PageMotion>
      }
    >
      <NovoEstoqueForm />
    </Suspense>
  );
}

function NovoEstoqueForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const equipamentoPre = searchParams.get("equipamento_id") ?? "";

  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loadingAtivos, setLoadingAtivos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [equipamentoId, setEquipamentoId] = useState(equipamentoPre);
  const [descricao, setDescricao] = useState("");
  const [quantidadeTotal, setQuantidadeTotal] = useState("");
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState("");
  const [unidade, setUnidade] = useState<UnidadeEstoque>("unidade");
  const [localizacao, setLocalizacao] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/estoque");
  }, [isTI, status, router]);

  useEffect(() => {
    fetch("/api/sec/ativos")
      .then((r) => r.json())
      .then((data) => {
        setAtivos(Array.isArray(data) ? data : []);
        setLoadingAtivos(false);
      })
      .catch(() => setLoadingAtivos(false));
  }, []);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!equipamentoId) next.equipamento_id = "Selecione um equipamento";
    if (!descricao.trim()) next.descricao = "Descrição é obrigatória";
    if (!unidade) next.unidade = "Unidade é obrigatória";

    const total = parseInt(quantidadeTotal, 10);
    const disponivel = parseInt(quantidadeDisponivel, 10);

    if (quantidadeTotal === "" || isNaN(total) || total < 0) {
      next.quantidade_total = "Quantidade total inválida";
    }
    if (quantidadeDisponivel === "" || isNaN(disponivel) || disponivel < 0) {
      next.quantidade_disponivel = "Quantidade disponível inválida";
    }
    if (
      !isNaN(total) &&
      !isNaN(disponivel) &&
      total >= 0 &&
      disponivel >= 0 &&
      disponivel > total
    ) {
      next.quantidade_disponivel =
        "Disponível não pode ser maior que o total";
    }

    if (estoqueMinimo !== "") {
      const min = parseInt(estoqueMinimo, 10);
      if (isNaN(min) || min < 0) {
        next.estoque_minimo = "Estoque mínimo inválido";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSalvando(true);
    try {
      const payload: CreateEstoquePayload = {
        equipamento_id: equipamentoId,
        descricao: descricao.trim(),
        quantidade_total: parseInt(quantidadeTotal, 10),
        quantidade_disponivel: parseInt(quantidadeDisponivel, 10),
        unidade,
      };

      if (localizacao.trim()) payload.localizacao = localizacao.trim();
      if (estoqueMinimo !== "") {
        payload.estoque_minimo = parseInt(estoqueMinimo, 10);
      }
      if (observacoes.trim()) payload.observacoes = observacoes.trim();

      const res = await fetch("/api/sec/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro");
      }

      const criado = await res.json();
      toast("Item cadastrado com sucesso.");
      router.push(`/sec/estoque/${criado.estoque_id}`);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Erro ao cadastrar item.",
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
          <Link href="/sec/estoque">
            <ArrowLeft className="h-4 w-4" /> Estoque
          </Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">Novo item</span>
      </div>

      <PageHeader
        title="Novo item"
        description="Cadastre um item de estoque vinculado a um equipamento."
      />

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
          {loadingAtivos ? (
            <div className="h-11 rounded-xl bg-muted/60 animate-pulse" />
          ) : ativos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ativo cadastrado.{" "}
              <Link
                href="/sec/ativos/novo"
                className="text-blue-500 dark:text-blue-400 underline"
              >
                Cadastre um ativo primeiro.
              </Link>
            </p>
          ) : (
            <div>
              <label className="text-sm font-medium">
                Equipamento <span className="text-destructive">*</span>
              </label>
              <Select value={equipamentoId} onValueChange={setEquipamentoId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((a) => (
                    <SelectItem
                      key={a.equipamento_id}
                      value={a.equipamento_id}
                    >
                      {a.nome} — {a.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipamento_id && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.equipamento_id}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Descrição <span className="text-destructive">*</span>
            </label>
            <Input
              className="mt-1.5"
              placeholder="Ex: Cabo HDMI 2m"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            {errors.descricao && (
              <p className="mt-1 text-xs text-destructive">{errors.descricao}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">
                Qtd. total <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                value={quantidadeTotal}
                onChange={(e) => setQuantidadeTotal(e.target.value)}
              />
              {errors.quantidade_total && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.quantidade_total}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">
                Qtd. disponível <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                value={quantidadeDisponivel}
                onChange={(e) => setQuantidadeDisponivel(e.target.value)}
              />
              {errors.quantidade_disponivel && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.quantidade_disponivel}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">
                Unidade <span className="text-destructive">*</span>
              </label>
              <Select
                value={unidade}
                onValueChange={(v) => setUnidade(v as UnidadeEstoque)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODAS_UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {unidadeLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Localização</label>
              <Input
                className="mt-1.5"
                placeholder="Ex: Almoxarifado TI — Prateleira A3"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estoque mínimo</label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
              />
              {errors.estoque_minimo && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.estoque_minimo}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              rows={3}
              className="mt-1.5"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/sec/estoque")}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={salvando || ativos.length === 0}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Salvar item"
            )}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
