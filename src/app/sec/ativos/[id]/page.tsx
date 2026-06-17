"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Monitor,
  Laptop,
  Package,
  Server,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { Ativo, StatusEquipamento, TipoEquipamento, Patrimonio } from "@/types/sec";
import {
  tipoLabel,
  statusLabel,
  statusVariant,
  TODOS_TIPOS,
  TODOS_STATUS,
} from "@/lib/sec-ativos";
import {
  statusPatrimonioLabel,
  statusPatrimonioVariant,
} from "@/lib/sec-patrimonio";

const TIPO_ICONS: Record<TipoEquipamento, LucideIcon> = {
  notebook: Laptop,
  desktop: Monitor,
  monitor: Monitor,
  periferico: Package,
  telefone: Smartphone,
  tablet: Tablet,
  servidor: Server,
  outro: Package,
};

function TipoIcon({ tipo, className }: { tipo: TipoEquipamento; className?: string }) {
  const Icon = TIPO_ICONS[tipo] ?? Monitor;
  return <Icon className={className} aria-hidden />;
}

function formatDate(value?: string): string {
  return value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";
}

function formatValor(value?: string): string {
  return value
    ? `R$ ${parseFloat(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "—";
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="h-[120px] rounded-xl bg-muted/60 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[160px] rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-[160px] rounded-xl bg-muted/60 animate-pulse" />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function AtivoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const id = params.id as string;

  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [loadingPatrimonio, setLoadingPatrimonio] = useState(true);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalDescartar, setModalDescartar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [descartando, setDescartando] = useState(false);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoEquipamento>("outro");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [statusAtivo, setStatusAtivo] = useState<StatusEquipamento>("ativo");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [localizacaoAtual, setLocalizacaoAtual] = useState("");
  const [dataAquisicao, setDataAquisicao] = useState("");
  const [valorAquisicao, setValorAquisicao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [garantiaAte, setGarantiaAte] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sec/ativos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Ativo) => {
        if (!cancelled) {
          setAtivo(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAtivo(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sec/patrimonio/equipamento/${id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) {
          setPatrimonios(Array.isArray(data) ? data : []);
          setLoadingPatrimonio(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingPatrimonio(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get("edit") === "true" && ativo && isTI) {
      abrirModalEditar();
      router.replace(`/sec/ativos/${id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, isTI, searchParams]);

  function abrirModalEditar() {
    if (!ativo) return;
    setNome(ativo.nome);
    setTipo(ativo.tipo);
    setMarca(ativo.marca);
    setModelo(ativo.modelo);
    setStatusAtivo(ativo.status);
    setNumeroSerie(ativo.numero_serie ?? "");
    setLocalizacaoAtual(ativo.localizacao_atual ?? "");
    setDataAquisicao(ativo.data_aquisicao ?? "");
    setValorAquisicao(ativo.valor_aquisicao ?? "");
    setFornecedor(ativo.fornecedor ?? "");
    setNotaFiscal(ativo.nota_fiscal ?? "");
    setGarantiaAte(ativo.garantia_ate ?? "");
    setObservacoes(ativo.observacoes ?? "");
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!ativo) return;
    if (!nome.trim() || !marca.trim() || !modelo.trim()) {
      toast("Preencha os campos obrigatórios.", "error");
      return;
    }

    setSalvando(true);
    try {
      const body: Record<string, string> = {
        nome: nome.trim(),
        tipo,
        marca: marca.trim(),
        modelo: modelo.trim(),
        status: statusAtivo,
        numero_serie: numeroSerie.trim(),
        localizacao_atual: localizacaoAtual.trim(),
        data_aquisicao: dataAquisicao,
        valor_aquisicao: valorAquisicao,
        fornecedor: fornecedor.trim(),
        nota_fiscal: notaFiscal.trim(),
        garantia_ate: garantiaAte,
        observacoes: observacoes.trim(),
      };

      const res = await fetch(`/api/sec/ativos/${ativo.equipamento_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();
      setAtivo(updated);
      setModalEditar(false);
      toast("Ativo atualizado com sucesso.");
    } catch {
      toast("Erro ao atualizar ativo. Tente novamente.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDescarte() {
    if (!ativo) return;
    setDescartando(true);
    try {
      const res = await fetch(`/api/sec/ativos/${ativo.equipamento_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "descartado" }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAtivo(updated);
      setModalDescartar(false);
      toast("Ativo descartado com sucesso.");
    } catch {
      toast("Erro ao descartar ativo. Tente novamente.", "error");
    } finally {
      setDescartando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <DetailSkeleton />
      </PageMotion>
    );
  }

  if (!ativo) {
    return (
      <PageMotion>
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/sec/ativos">
            <ArrowLeft className="h-4 w-4" /> Ativos
          </Link>
        </Button>
        <p className="text-muted-foreground">Ativo não encontrado.</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="space-y-8 max-w-5xl min-w-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="pl-0">
            <Link href="/sec/ativos">
              <ArrowLeft className="h-4 w-4" /> Ativos
            </Link>
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm text-muted-foreground truncate">
            {ativo.nome}
          </span>
        </div>

        <Card>
          <CardContent className="pt-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                  <TipoIcon tipo={ativo.tipo} className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    {ativo.nome}
                  </h1>
                  <p className="text-[15px] text-muted-foreground mt-1">
                    {ativo.modelo}
                  </p>
                  <div className="mt-4">
                    <Badge variant={statusVariant(ativo.status)}>
                      {statusLabel(ativo.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              {isTI && ativo.status !== "descartado" && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={abrirModalEditar}
                    className="gap-1.5"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setModalDescartar(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> Descartar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Tipo" value={tipoLabel(ativo.tipo)} />
              <InfoRow label="Marca" value={ativo.marca || "—"} />
              <InfoRow label="Modelo" value={ativo.modelo || "—"} />
              <InfoRow label="Série" value={ativo.numero_serie || "—"} />
              <InfoRow
                label="Localização"
                value={ativo.localizacao_atual || "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aquisição</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Data"
                value={formatDate(ativo.data_aquisicao)}
              />
              <InfoRow
                label="Valor"
                value={formatValor(ativo.valor_aquisicao)}
              />
              <InfoRow label="Fornecedor" value={ativo.fornecedor || "—"} />
              <InfoRow
                label="Nota fiscal"
                value={ativo.nota_fiscal || "—"}
              />
              <InfoRow
                label="Garantia até"
                value={formatDate(ativo.garantia_ate)}
              />
            </CardContent>
          </Card>
        </div>

        {ativo.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ativo.observacoes}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPatrimonio ? (
              <div className="h-10 rounded-lg bg-muted/60 animate-pulse" />
            ) : (() => {
              const registroAtivo = patrimonios.find((p) => p.status !== "baixado");
              if (!registroAtivo) {
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Nenhum registro patrimonial.
                    </p>
                    {isTI && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5 shrink-0">
                        <Link href={`/sec/patrimonio/novo?equipamento_id=${id}`}>
                          <ShieldCheck className="h-4 w-4" />
                          Tombar ativo
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-foreground">
                      {registroAtivo.numero_patrimonio}
                    </span>
                    <Badge variant={statusPatrimonioVariant(registroAtivo.status)}>
                      {statusPatrimonioLabel(registroAtivo.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Tombamento:{" "}
                      {registroAtivo.data_tombamento
                        ? new Date(registroAtivo.data_tombamento + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </span>
                    <span>
                      Valor:{" "}
                      {registroAtivo.valor_tombamento
                        ? `R$ ${parseFloat(registroAtivo.valor_tombamento).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                  <Button variant="link" size="sm" asChild className="h-auto p-0 text-blue-500 dark:text-blue-400">
                    <Link href={`/sec/patrimonio/${registroAtivo.patrimonio_id}`}>
                      Ver registro
                    </Link>
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Histórico de movimentações disponível na Sprint 3
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar ativo</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome</label>
              <Input className="mt-1.5" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEquipamento)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TODOS_TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{tipoLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={statusAtivo} onValueChange={(v) => setStatusAtivo(v as StatusEquipamento)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TODOS_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Marca</label>
                <Input className="mt-1.5" value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Modelo</label>
                <Input className="mt-1.5" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Número de série</label>
                <Input className="mt-1.5" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Localização</label>
                <Input className="mt-1.5" value={localizacaoAtual} onChange={(e) => setLocalizacaoAtual(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Data de aquisição</label>
                <Input type="date" className="mt-1.5" value={dataAquisicao} onChange={(e) => setDataAquisicao(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Valor</label>
                <Input type="number" step="0.01" className="mt-1.5" value={valorAquisicao} onChange={(e) => setValorAquisicao(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Fornecedor</label>
                <Input className="mt-1.5" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nota fiscal</label>
                <Input className="mt-1.5" value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Garantia até</label>
              <Input type="date" className="mt-1.5" value={garantiaAte} onChange={(e) => setGarantiaAte(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Observações</label>
              <Textarea rows={3} className="mt-1.5" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button
              disabled={salvando}
              onClick={salvarEdicao}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalDescartar} onOpenChange={setModalDescartar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Descartar ativo</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza? O ativo{" "}
              <strong className="text-foreground">{ativo.nome}</strong> será
              marcado como descartado. Esta ação pode ser revertida.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDescartar(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={descartando} onClick={confirmarDescarte}>
              {descartando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Descartar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
