"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, ArrowDownToLine, ShieldCheck } from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { Ativo, Patrimonio } from "@/types/sec";
import { statusPatrimonioLabel, statusPatrimonioVariant } from "@/lib/sec-patrimonio";

function formatDate(value?: string): string {
  return value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : "—";
}

function formatValor(value?: string): string {
  return value
    ? `R$ ${parseFloat(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "—";
}

function formatDepreciacao(value?: string): string {
  if (!value) return "—";
  return `${(parseFloat(value) * 100).toFixed(0)}%`;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{children}</span>
    </div>
  );
}

export default function PatrimonioDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const id = params.id as string;

  const [patrimonio, setPatrimonio] = useState<Patrimonio | null>(null);
  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baixando, setBaixando] = useState(false);

  const [numeroPatrimonio, setNumeroPatrimonio] = useState("");
  const [documentoRef, setDocumentoRef] = useState("");
  const [valorTombamento, setValorTombamento] = useState("");
  const [depreciacao, setDepreciacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataBaixa, setDataBaixa] = useState("");
  const [motivoBaixa, setMotivoBaixa] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sec/patrimonio/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(async (pat: Patrimonio) => {
        if (cancelled) return;
        setPatrimonio(pat);
        const ativoRes = await fetch(`/api/sec/ativos/${pat.equipamento_id}`);
        if (ativoRes.ok) setAtivo(await ativoRes.json());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPatrimonio(null);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  function abrirEditar() {
    if (!patrimonio) return;
    setNumeroPatrimonio(patrimonio.numero_patrimonio);
    setDocumentoRef(patrimonio.documento_referencia ?? "");
    setValorTombamento(patrimonio.valor_tombamento ?? "");
    setDepreciacao(patrimonio.depreciacao_anual_pct ?? "");
    setObservacoes(patrimonio.observacoes ?? "");
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!patrimonio) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sec/patrimonio/${patrimonio.patrimonio_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: patrimonio.status,
          numero_patrimonio: numeroPatrimonio.trim(),
          documento_referencia: documentoRef.trim(),
          valor_tombamento: valorTombamento,
          depreciacao_anual_pct: depreciacao,
          observacoes: observacoes.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setPatrimonio(await res.json());
      setModalEditar(false);
      toast("Patrimônio atualizado com sucesso.");
    } catch {
      toast("Erro ao atualizar patrimônio.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarBaixa() {
    if (!patrimonio || !dataBaixa || !motivoBaixa.trim()) {
      toast("Preencha data e motivo da baixa.", "error");
      return;
    }
    setBaixando(true);
    try {
      const res = await fetch(`/api/sec/patrimonio/${patrimonio.patrimonio_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "baixado",
          data_baixa: dataBaixa,
          motivo_baixa: motivoBaixa.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setPatrimonio(await res.json());
      setModalBaixa(false);
      toast("Patrimônio baixado com sucesso.");
    } catch {
      toast("Erro ao baixar patrimônio.", "error");
    } finally {
      setBaixando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <div className="space-y-6 max-w-5xl">
          <div className="h-[120px] rounded-xl bg-muted/60 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[160px] rounded-xl bg-muted/60 animate-pulse" />
            <div className="h-[160px] rounded-xl bg-muted/60 animate-pulse" />
          </div>
        </div>
      </PageMotion>
    );
  }

  if (!patrimonio) {
    return (
      <PageMotion>
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/sec/patrimonio"><ArrowLeft className="h-4 w-4" /> Patrimônio</Link>
        </Button>
        <p className="text-muted-foreground">Patrimônio não encontrado.</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="space-y-8 max-w-5xl min-w-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="pl-0">
            <Link href="/sec/patrimonio"><ArrowLeft className="h-4 w-4" /> Patrimônio</Link>
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm text-muted-foreground">{patrimonio.numero_patrimonio}</span>
        </div>

        <Card>
          <CardContent className="pt-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                  <ShieldCheck className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{patrimonio.numero_patrimonio}</h1>
                  <Badge variant={statusPatrimonioVariant(patrimonio.status)} className="mt-3">
                    {statusPatrimonioLabel(patrimonio.status)}
                  </Badge>
                </div>
              </div>
              {isTI && patrimonio.status !== "baixado" && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={abrirEditar} className="gap-1.5">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDataBaixa(new Date().toISOString().split("T")[0]);
                      setMotivoBaixa("");
                      setModalBaixa(true);
                    }}
                    className="gap-1.5"
                  >
                    <ArrowDownToLine className="h-4 w-4" /> Baixar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Equipamento</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="ID">{patrimonio.equipamento_id}</InfoRow>
              <InfoRow label="Nome">
                {ativo ? (
                  <Link href={`/sec/ativos/${ativo.equipamento_id}`} className="text-blue-500 dark:text-blue-400 underline">
                    {ativo.nome}
                  </Link>
                ) : "—"}
              </InfoRow>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Registro</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Data tombamento">{formatDate(patrimonio.data_tombamento)}</InfoRow>
              <InfoRow label="Responsável">{patrimonio.responsavel_tombamento}</InfoRow>
              <InfoRow label="Documento">{patrimonio.documento_referencia || "—"}</InfoRow>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Financeiro</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Valor">{formatValor(patrimonio.valor_tombamento)}</InfoRow>
              <InfoRow label="Depreciação anual">{formatDepreciacao(patrimonio.depreciacao_anual_pct)}</InfoRow>
            </CardContent>
          </Card>
          {patrimonio.status === "baixado" && (
            <Card>
              <CardHeader><CardTitle>Baixa</CardTitle></CardHeader>
              <CardContent>
                <InfoRow label="Data baixa">{formatDate(patrimonio.data_baixa)}</InfoRow>
                <InfoRow label="Motivo">{patrimonio.motivo_baixa || "—"}</InfoRow>
              </CardContent>
            </Card>
          )}
        </div>

        {patrimonio.observacoes && (
          <Card>
            <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patrimonio.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader><DialogTitle>Editar patrimônio</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nº patrimônio</label>
              <Input className="mt-1.5" value={numeroPatrimonio} onChange={(e) => setNumeroPatrimonio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Documento referência</label>
              <Input className="mt-1.5" value={documentoRef} onChange={(e) => setDocumentoRef(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input type="number" step="0.01" className="mt-1.5" value={valorTombamento} onChange={(e) => setValorTombamento(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Depreciação</label>
                <Input type="number" step="0.01" className="mt-1.5" value={depreciacao} onChange={(e) => setDepreciacao(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea rows={3} className="mt-1.5" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button disabled={salvando} onClick={salvarEdicao} className="bg-blue-500 text-white dark:bg-blue-400 dark:text-foreground">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalBaixa} onOpenChange={setModalBaixa}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader><DialogTitle>Baixar patrimônio</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirmar baixa do patrimônio <strong>{patrimonio.numero_patrimonio}</strong>.
            </p>
            <div>
              <label className="text-sm font-medium">Data da baixa</label>
              <Input type="date" className="mt-1.5" value={dataBaixa} onChange={(e) => setDataBaixa(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Motivo</label>
              <Textarea rows={3} className="mt-1.5" value={motivoBaixa} onChange={(e) => setMotivoBaixa(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBaixa(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={baixando || !dataBaixa || !motivoBaixa.trim()} onClick={confirmarBaixa}>
              {baixando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
