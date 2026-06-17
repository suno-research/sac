"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Ativo, ItemEstoque, UnidadeEstoque } from "@/types/sec";
import {
  isEstoqueCritico,
  unidadeLabel,
  TODAS_UNIDADES,
} from "@/lib/sec-estoque";
import { cn } from "@/lib/utils";

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="h-[120px] rounded-xl bg-muted/60 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] rounded-xl bg-muted/60 animate-pulse" />
        ))}
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

function qtyCardClass(item: ItemEstoque, type: "total" | "disponivel" | "alocada"): string {
  if (type === "disponivel") {
    if (item.quantidade_disponivel === 0) return "text-destructive";
    if (isEstoqueCritico(item)) return "text-warning";
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (type === "alocada" && item.quantidade_alocada > 0) {
    return "text-blue-600 dark:text-blue-400";
  }
  return "text-foreground";
}

export default function EstoqueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const id = params.id as string;

  const [item, setItem] = useState<ItemEstoque | null>(null);
  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalAjustar, setModalAjustar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ajustando, setAjustando] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState<UnidadeEstoque>("unidade");
  const [localizacao, setLocalizacao] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [quantidadeTotal, setQuantidadeTotal] = useState("");
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState("");
  const [qtyErrors, setQtyErrors] = useState<{
    quantidade_total?: string;
    quantidade_disponivel?: string;
  }>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sec/estoque/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(async (data: ItemEstoque) => {
        if (cancelled) return;
        setItem(data);
        const ativoRes = await fetch(`/api/sec/ativos/${data.equipamento_id}`);
        if (ativoRes.ok) setAtivo(await ativoRes.json());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get("edit") === "true" && item && isTI) {
      abrirModalEditar();
      router.replace(`/sec/estoque/${id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isTI, searchParams]);

  function abrirModalEditar() {
    if (!item) return;
    setDescricao(item.descricao);
    setUnidade(item.unidade);
    setLocalizacao(item.localizacao ?? "");
    setEstoqueMinimo(
      item.estoque_minimo !== undefined ? String(item.estoque_minimo) : ""
    );
    setObservacoes(item.observacoes ?? "");
    setModalEditar(true);
  }

  function abrirModalAjustar() {
    if (!item) return;
    setQuantidadeTotal(String(item.quantidade_total));
    setQuantidadeDisponivel(String(item.quantidade_disponivel));
    setQtyErrors({});
    setModalAjustar(true);
  }

  async function salvarEdicao() {
    if (!item) return;
    if (!descricao.trim()) {
      toast("Descrição é obrigatória.", "error");
      return;
    }

    setSalvando(true);
    try {
      const body: Record<string, string | number | undefined> = {
        descricao: descricao.trim(),
        unidade,
        localizacao: localizacao.trim(),
        observacoes: observacoes.trim(),
      };
      if (estoqueMinimo !== "") {
        body.estoque_minimo = parseInt(estoqueMinimo, 10);
      }

      const res = await fetch(`/api/sec/estoque/${item.estoque_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      setItem(await res.json());
      setModalEditar(false);
      toast("Item atualizado com sucesso.");
    } catch {
      toast("Erro ao atualizar item.", "error");
    } finally {
      setSalvando(false);
    }
  }

  function validateQty(): boolean {
    const next: typeof qtyErrors = {};
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

    setQtyErrors(next);
    return Object.keys(next).length === 0;
  }

  async function salvarAjuste() {
    if (!item || !validateQty()) return;

    setAjustando(true);
    try {
      const res = await fetch(`/api/sec/estoque/${item.estoque_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade_total: parseInt(quantidadeTotal, 10),
          quantidade_disponivel: parseInt(quantidadeDisponivel, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro");
      }

      setItem(await res.json());
      setModalAjustar(false);
      toast("Quantidades ajustadas com sucesso.");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Erro ao ajustar quantidades.",
        "error"
      );
    } finally {
      setAjustando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <DetailSkeleton />
      </PageMotion>
    );
  }

  if (!item) {
    return (
      <PageMotion>
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/sec/estoque">
            <ArrowLeft className="h-4 w-4" /> Estoque
          </Link>
        </Button>
        <p className="text-muted-foreground">Item não encontrado.</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="space-y-8 max-w-5xl min-w-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="pl-0">
            <Link href="/sec/estoque">
              <ArrowLeft className="h-4 w-4" /> Estoque
            </Link>
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm text-muted-foreground truncate">
            {item.descricao}
          </span>
        </div>

        <Card>
          <CardContent className="pt-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                  <Package className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    {item.descricao}
                  </h1>
                  <p className="text-[15px] text-muted-foreground mt-1">
                    {unidadeLabel(item.unidade)}
                    {item.localizacao ? ` · ${item.localizacao}` : ""}
                  </p>
                  {isEstoqueCritico(item) && (
                    <p className="mt-2 text-sm font-medium text-warning">
                      {item.quantidade_disponivel === 0
                        ? "Estoque zerado"
                        : "Estoque em nível crítico"}
                    </p>
                  )}
                </div>
              </div>
              {isTI && (
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
                    variant="outline"
                    size="sm"
                    onClick={abrirModalAjustar}
                    className="gap-1.5 border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Ajustar quantidades
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-4xl font-semibold tabular-nums",
                  qtyCardClass(item, "total")
                )}
              >
                {item.quantidade_total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-4xl font-semibold tabular-nums",
                  qtyCardClass(item, "disponivel")
                )}
              >
                {item.quantidade_disponivel}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alocado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-4xl font-semibold tabular-nums",
                  qtyCardClass(item, "alocada")
                )}
              >
                {item.quantidade_alocada}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Equipamento</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="ID" value={item.equipamento_id} />
              <InfoRow
                label="Nome"
                value={
                  ativo ? (
                    ativo.nome
                  ) : "—"
                }
              />
              {ativo && (
                <div className="pt-2">
                  <Link
                    href={`/sec/ativos/${ativo.equipamento_id}`}
                    className="text-sm text-blue-500 dark:text-blue-400 underline"
                  >
                    Ver ativo
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Unidade" value={unidadeLabel(item.unidade)} />
              <InfoRow
                label="Estoque mínimo"
                value={
                  item.estoque_minimo !== undefined
                    ? String(item.estoque_minimo)
                    : "—"
                }
              />
              <InfoRow label="Localização" value={item.localizacao || "—"} />
            </CardContent>
          </Card>
        </div>

        {item.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {item.observacoes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                className="mt-1.5"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unidade</label>
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
            <div>
              <label className="text-sm font-medium">Localização</label>
              <Input
                className="mt-1.5"
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
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>
              Cancelar
            </Button>
            <Button
              disabled={salvando}
              onClick={salvarEdicao}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalAjustar} onOpenChange={setModalAjustar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Ajustar quantidades</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Atualize as quantidades de{" "}
              <strong className="text-foreground">{item.descricao}</strong>.
              A quantidade alocada será recalculada automaticamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Qtd. total</label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={quantidadeTotal}
                  onChange={(e) => setQuantidadeTotal(e.target.value)}
                />
                {qtyErrors.quantidade_total && (
                  <p className="mt-1 text-xs text-destructive">
                    {qtyErrors.quantidade_total}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Qtd. disponível</label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={quantidadeDisponivel}
                  onChange={(e) => setQuantidadeDisponivel(e.target.value)}
                />
                {qtyErrors.quantidade_disponivel && (
                  <p className="mt-1 text-xs text-destructive">
                    {qtyErrors.quantidade_disponivel}
                  </p>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAjustar(false)}>
              Cancelar
            </Button>
            <Button
              disabled={ajustando}
              onClick={salvarAjuste}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              {ajustando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar ajuste"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
