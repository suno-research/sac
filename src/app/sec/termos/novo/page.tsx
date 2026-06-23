"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
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
import type { Alocacao, CreateTermoPayload } from "@/types/sec";

type FormErrors = Partial<Record<"alocacao_id" | "data_emissao", string>>;

export default function NovoTermoPage() {
  return (
    <Suspense fallback={<PageMotion><div className="h-40 rounded-xl bg-muted/60 animate-pulse" /></PageMotion>}>
      <NovoTermoForm />
    </Suspense>
  );
}

function NovoTermoForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const alocacaoPre = searchParams.get("alocacao_id") ?? "";

  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [loadingAloc, setLoadingAloc] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [alocacaoId, setAlocacaoId] = useState(alocacaoPre);
  const [dataEmissao, setDataEmissao] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [canal, setCanal] = useState("manual");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/termos");
  }, [isTI, status, router]);

  useEffect(() => {
    fetch("/api/sec/alocacoes")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAlocacoes(list.filter((a: Alocacao) => a.status === "ativa"));
        setLoadingAloc(false);
      })
      .catch(() => setLoadingAloc(false));
  }, []);

  const alocacaoSelecionada = useMemo(
    () => alocacoes.find((a) => a.alocacao_id === alocacaoId),
    [alocacoes, alocacaoId]
  );

  function validate(): boolean {
    const next: FormErrors = {};
    if (!alocacaoId) next.alocacao_id = "Selecione uma alocação";
    if (!dataEmissao) next.data_emissao = "Data de emissão é obrigatória";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !alocacaoSelecionada) return;

    setSalvando(true);
    try {
      const payload: CreateTermoPayload = {
        alocacao_id: alocacaoSelecionada.alocacao_id,
        equipamento_id: alocacaoSelecionada.equipamento_id,
        funcionario_id: alocacaoSelecionada.funcionario_id,
        funcionario_nome: alocacaoSelecionada.funcionario_nome,
        funcionario_email: alocacaoSelecionada.funcionario_email,
        status: "pendente",
        data_emissao: dataEmissao,
        canal_assinatura: canal,
      };
      if (documentoUrl.trim()) payload.documento_url = documentoUrl.trim();
      if (observacoes.trim()) payload.observacoes = observacoes.trim();

      const res = await fetch("/api/sec/termos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar termo");
      }

      toast("Termo registrado com sucesso.");
      router.push("/sec/termos");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao registrar termo.", "error");
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
          <Link href="/sec/termos"><ArrowLeft className="h-4 w-4" /> Termos</Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">Novo termo</span>
      </div>

      <PageHeader title="Novo termo" description="Emita um termo de responsabilidade por alocação." />

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
          {loadingAloc ? (
            <div className="h-11 rounded-xl bg-muted/60 animate-pulse" />
          ) : alocacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma alocação ativa.{" "}
              <Link href="/sec/alocacoes/nova" className="text-blue-500 dark:text-blue-400 underline">
                Crie uma alocação primeiro.
              </Link>
            </p>
          ) : (
            <div>
              <label className="text-sm font-medium">Alocação <span className="text-destructive">*</span></label>
              <Select value={alocacaoId} onValueChange={setAlocacaoId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione a alocação" /></SelectTrigger>
                <SelectContent>
                  {alocacoes.map((a) => (
                    <SelectItem key={a.alocacao_id} value={a.alocacao_id}>
                      {a.funcionario_nome} — {a.equipamento_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.alocacao_id && <p className="mt-1 text-xs text-destructive">{errors.alocacao_id}</p>}
              {alocacaoSelecionada && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Funcionário:</span> {alocacaoSelecionada.funcionario_nome}</p>
                  <p><span className="text-muted-foreground">E-mail:</span> {alocacaoSelecionada.funcionario_email}</p>
                  <p><span className="text-muted-foreground">Equipamento:</span> {alocacaoSelecionada.equipamento_id}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Data de emissão <span className="text-destructive">*</span></label>
              <Input type="date" className="mt-1.5" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
              {errors.data_emissao && <p className="mt-1 text-xs text-destructive">{errors.data_emissao}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Canal de assinatura</label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="clicksign" disabled title="Disponível na Fase 2">
                    ClickSign (Fase 2)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">URL do documento</label>
            <Input className="mt-1.5" placeholder="https://..." value={documentoUrl} onChange={(e) => setDocumentoUrl(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea rows={3} className="mt-1.5" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/sec/termos")}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={salvando || alocacoes.length === 0}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar termo"}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
