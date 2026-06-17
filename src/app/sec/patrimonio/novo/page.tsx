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
import type { Ativo, CreatePatrimonioPayload, StatusPatrimonio } from "@/types/sec";
import { statusPatrimonioLabel, TODOS_STATUS_PATRIMONIO } from "@/lib/sec-patrimonio";

type FormErrors = Partial<Record<keyof CreatePatrimonioPayload, string>>;

export default function NovoPatrimonioPage() {
  return (
    <Suspense
      fallback={
        <PageMotion>
          <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
        </PageMotion>
      }
    >
      <NovoPatrimonioForm />
    </Suspense>
  );
}

function NovoPatrimonioForm() {
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
  const [numeroPatrimonio, setNumeroPatrimonio] = useState("");
  const [statusPat, setStatusPat] = useState<StatusPatrimonio>("ativo");
  const [dataTombamento, setDataTombamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [responsavel, setResponsavel] = useState("");
  const [documentoRef, setDocumentoRef] = useState("");
  const [valorTombamento, setValorTombamento] = useState("");
  const [depreciacao, setDepreciacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/patrimonio");
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

  const responsavelEfetivo = responsavel || session?.user?.email || "";

  function validate(): boolean {
    const next: FormErrors = {};
    if (!equipamentoId) next.equipamento_id = "Selecione um equipamento";
    if (!numeroPatrimonio.trim()) next.numero_patrimonio = "Número é obrigatório";
    if (!dataTombamento) next.data_tombamento = "Data é obrigatória";
    if (!responsavelEfetivo.trim()) next.responsavel_tombamento = "Responsável é obrigatório";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSalvando(true);
    try {
      const payload: CreatePatrimonioPayload = {
        equipamento_id: equipamentoId,
        numero_patrimonio: numeroPatrimonio.trim(),
        status: statusPat,
        data_tombamento: dataTombamento,
        responsavel_tombamento: responsavelEfetivo.trim(),
      };
      if (documentoRef.trim()) payload.documento_referencia = documentoRef.trim();
      if (valorTombamento) payload.valor_tombamento = valorTombamento;
      if (depreciacao) payload.depreciacao_anual_pct = depreciacao;
      if (observacoes.trim()) payload.observacoes = observacoes.trim();

      const res = await fetch("/api/sec/patrimonio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro");
      }
      const criado = await res.json();
      toast("Patrimônio cadastrado com sucesso.");
      router.push(`/sec/patrimonio/${criado.patrimonio_id}`);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Erro ao cadastrar patrimônio.",
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
          <Link href="/sec/patrimonio"><ArrowLeft className="h-4 w-4" /> Patrimônio</Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">Novo patrimônio</span>
      </div>

      <PageHeader title="Novo patrimônio" description="Registre o tombamento de um equipamento." />

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
          {loadingAtivos ? (
            <div className="h-11 rounded-xl bg-muted/60 animate-pulse" />
          ) : ativos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ativo cadastrado.{" "}
              <Link href="/sec/ativos/novo" className="text-blue-500 dark:text-blue-400 underline">
                Cadastre um ativo primeiro.
              </Link>
            </p>
          ) : (
            <div>
              <label className="text-sm font-medium">Equipamento *</label>
              <Select value={equipamentoId} onValueChange={setEquipamentoId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((a) => (
                    <SelectItem key={a.equipamento_id} value={a.equipamento_id}>
                      {a.nome} — {a.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipamento_id && (
                <p className="mt-1 text-xs text-destructive">{errors.equipamento_id}</p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nº patrimônio *</label>
              <Input className="mt-1.5" value={numeroPatrimonio} onChange={(e) => setNumeroPatrimonio(e.target.value)} />
              {errors.numero_patrimonio && <p className="mt-1 text-xs text-destructive">{errors.numero_patrimonio}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Status *</label>
              <Select value={statusPat} onValueChange={(v) => setStatusPat(v as StatusPatrimonio)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TODOS_STATUS_PATRIMONIO.map((s) => (
                    <SelectItem key={s} value={s}>{statusPatrimonioLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Data tombamento *</label>
              <Input type="date" className="mt-1.5" value={dataTombamento} onChange={(e) => setDataTombamento(e.target.value)} />
              {errors.data_tombamento && <p className="mt-1 text-xs text-destructive">{errors.data_tombamento}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Responsável *</label>
              <Input
                className="mt-1.5"
                value={responsavelEfetivo}
                onChange={(e) => setResponsavel(e.target.value)}
              />
              {errors.responsavel_tombamento && <p className="mt-1 text-xs text-destructive">{errors.responsavel_tombamento}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Documento referência</label>
              <Input className="mt-1.5" value={documentoRef} onChange={(e) => setDocumentoRef(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Valor tombamento</label>
              <Input type="number" step="0.01" className="mt-1.5" value={valorTombamento} onChange={(e) => setValorTombamento(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Depreciação anual (%)</label>
            <Input type="number" step="0.01" className="mt-1.5" placeholder="Ex: 0.20 para 20%" value={depreciacao} onChange={(e) => setDepreciacao(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea rows={3} className="mt-1.5" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/sec/patrimonio")}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={salvando || ativos.length === 0}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar patrimônio"}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
