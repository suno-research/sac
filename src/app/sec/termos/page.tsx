"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText,
  Loader2,
  Plus,
  SearchX,
  XCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { StatusTermo, Termo } from "@/types/sec";
import {
  statusTermoLabel,
  statusTermoVariant,
  TODOS_STATUS_TERMO,
} from "@/lib/sec-termos";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactName,
  tdCompactText,
  tdCompactActions,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = [10, 50, 100];

type StatusAba = StatusTermo;

const ABAS: { key: StatusAba; label: string }[] = [
  { key: "pendente", label: "Pendentes" },
  { key: "assinado", label: "Assinados" },
  { key: "cancelado", label: "Cancelados" },
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function canalLabel(canal?: string): string {
  if (!canal) return "—";
  if (canal === "clicksign") return "ClickSign";
  if (canal === "manual") return "Manual";
  return canal;
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function TermosPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const isTI = session?.user?.role === "ti";

  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<StatusAba>("pendente");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  const [detalhe, setDetalhe] = useState<Termo | null>(null);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [termoAcao, setTermoAcao] = useState<Termo | null>(null);
  const [dataAssinatura, setDataAssinatura] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [obsAssinatura, setObsAssinatura] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/sec/termos")
      .then((r) => r.json())
      .then((data) => setTermos(Array.isArray(data) ? data : []))
      .catch(() => toast("Erro ao carregar termos.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const contagemPorStatus = useMemo(() => {
    const counts: Record<StatusTermo, number> = {
      pendente: 0,
      assinado: 0,
      cancelado: 0,
    };
    termos.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [termos]);

  const listaAtual = useMemo(() => {
    if (statusFiltro !== "todos") return termos.filter((t) => t.status === statusFiltro);
    return termos.filter((t) => t.status === aba);
  }, [termos, aba, statusFiltro]);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return listaAtual.filter((t) => {
      if (!q) return true;
      return (
        t.funcionario_nome.toLowerCase().includes(q) ||
        t.termo_id.toLowerCase().includes(q) ||
        t.alocacao_id.toLowerCase().includes(q)
      );
    });
  }, [listaAtual, busca]);

  const paginationKey = `${aba}|${statusFiltro}|${busca}|${pageSize}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const hasFilters = Boolean(busca || statusFiltro !== "todos");
  const abaAtual = statusFiltro !== "todos" ? (statusFiltro as StatusAba) : aba;

  const emptyTitle: Record<StatusAba, string> = {
    pendente: "Nenhum termo pendente",
    assinado: "Nenhum termo assinado",
    cancelado: "Nenhum termo cancelado",
  };

  const emptyDesc: Record<StatusAba, string> = {
    pendente: "Termos aguardando assinatura aparecerão aqui.",
    assinado: "Termos assinados aparecerão aqui.",
    cancelado: "Termos cancelados aparecerão aqui.",
  };

  function atualizarLocal(updated: Termo) {
    setTermos((prev) => prev.map((t) => (t.termo_id === updated.termo_id ? updated : t)));
    setDetalhe((prev) => (prev?.termo_id === updated.termo_id ? updated : prev));
  }

  function abrirAssinatura(termo: Termo, e?: React.MouseEvent) {
    e?.stopPropagation();
    setTermoAcao(termo);
    setDataAssinatura(new Date().toISOString().split("T")[0]);
    setObsAssinatura("");
    setModalAssinatura(true);
  }

  function abrirCancelar(termo: Termo, e?: React.MouseEvent) {
    e?.stopPropagation();
    setTermoAcao(termo);
    setModalCancelar(true);
  }

  async function registrarAssinatura() {
    if (!termoAcao) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sec/termos/${termoAcao.termo_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "assinado",
          data_assinatura: dataAssinatura,
          observacoes: obsAssinatura.trim() || termoAcao.observacoes,
        }),
      });
      if (!res.ok) throw new Error();
      atualizarLocal(await res.json());
      setModalAssinatura(false);
      toast("Assinatura registrada com sucesso.");
    } catch {
      toast("Erro ao registrar assinatura.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarTermo() {
    if (!termoAcao) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sec/termos/${termoAcao.termo_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      });
      if (!res.ok) throw new Error();
      atualizarLocal(await res.json());
      setModalCancelar(false);
      toast("Termo cancelado.");
    } catch {
      toast("Erro ao cancelar termo.", "error");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Termos" description="Carregando..." />
        <div className="h-64 rounded-xl bg-muted/60 animate-pulse" />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Termos"
        description="Registro de termos de responsabilidade por equipamento."
        action={
          isTI ? (
            <Button
              onClick={() => router.push("/sec/termos/novo")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Novo termo
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setAba(key); setStatusFiltro("todos"); }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 sm:px-5",
              aba === key && statusFiltro === "todos"
                ? "bg-blue-500 text-white shadow-sm dark:bg-blue-400 dark:text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {label} ({contagemPorStatus[key]})
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Buscar por funcionário ou termo_id..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={() => { setBusca(""); setStatusFiltro("todos"); }}
      >
        <FilterSelect value={statusFiltro} onChange={setStatusFiltro} aria-label="Filtrar por status">
          <option value="todos">Todos os status</option>
          {TODOS_STATUS_TERMO.map((s) => (
            <option key={s} value={s}>{statusTermoLabel(s)}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {termos.length === 0 && !hasFilters ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={FileText}
            title="Nenhum termo registrado"
            description="Emita o primeiro termo de responsabilidade."
            actionLabel={isTI ? "Novo termo" : undefined}
            onAction={isTI ? () => router.push("/sec/termos/novo") : undefined}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[960px]">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "22%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">Funcionário</th>
                  <th className={thCompactMid} scope="col">Alocação</th>
                  <th className={thCompactMid} scope="col">Emissão</th>
                  <th className={thCompactMid} scope="col">Assinatura</th>
                  <th className={thCompactMid} scope="col">Canal</th>
                  <th className={thCompactMid} scope="col">Status</th>
                  <th className={thCompactLast} scope="col">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      {hasFilters ? (
                        <EmptyState icon={SearchX} title="Nenhum resultado" description="Ajuste busca ou filtros." actionLabel="Limpar filtros" onAction={() => { setBusca(""); setStatusFiltro("todos"); }} />
                      ) : (
                        <EmptyState icon={FileText} title={emptyTitle[abaAtual]} description={emptyDesc[abaAtual]} />
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((termo) => (
                    <tr key={termo.termo_id} className={cn(trHover, "cursor-pointer")} onClick={() => setDetalhe(termo)}>
                      <td className={tdCompactName}>
                        <p className="truncate font-medium">{termo.funcionario_nome}</p>
                        <p className="truncate text-xs text-muted-foreground">{termo.funcionario_email}</p>
                      </td>
                      <td className={cn(tdCompactText, "font-mono text-xs")}>{termo.alocacao_id}</td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>{formatDate(termo.data_emissao)}</td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>{formatDate(termo.data_assinatura)}</td>
                      <td className={tdCompactText}><span className="text-xs">{canalLabel(termo.canal_assinatura)}</span></td>
                      <td className={tdCompactText}>
                        <Badge variant={statusTermoVariant(termo.status)} className="text-[11px]">{statusTermoLabel(termo.status)}</Badge>
                      </td>
                      <td className={tdCompactActions}>
                        {isTI && termo.status === "pendente" && (
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={(e) => abrirAssinatura(termo, e)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Assinar</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive-muted" onClick={(e) => abrirCancelar(termo, e)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <TablePagination
              totalItems={filtered.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: p }))}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPageByKey((prev) => ({ ...prev, [`${aba}|${statusFiltro}|${busca}|${size}`]: 1 })); }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="termos"
            />
          )}
        </div>
      )}

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhe do termo</DialogTitle></DialogHeader>
          {detalhe && (
            <>
              <DialogBody className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Termo ID" value={detalhe.termo_id} />
                <DetailField label="Status" value={<Badge variant={statusTermoVariant(detalhe.status)}>{statusTermoLabel(detalhe.status)}</Badge>} />
                <DetailField label="Funcionário" value={detalhe.funcionario_nome} />
                <DetailField label="E-mail" value={detalhe.funcionario_email} />
                <DetailField label="Alocação" value={detalhe.alocacao_id} />
                <DetailField label="Equipamento" value={detalhe.equipamento_id} />
                <DetailField label="Emissão" value={formatDate(detalhe.data_emissao)} />
                <DetailField label="Assinatura" value={formatDate(detalhe.data_assinatura)} />
                <DetailField label="Canal" value={canalLabel(detalhe.canal_assinatura)} />
                {detalhe.assinado_por && <DetailField label="Assinado por" value={detalhe.assinado_por} />}
                {detalhe.documento_url && (
                  <div className="sm:col-span-2">
                    <a href={detalhe.documento_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline dark:text-blue-400">
                      Abrir documento <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                {detalhe.observacoes && <div className="sm:col-span-2"><DetailField label="Observações" value={detalhe.observacoes} /></div>}
              </DialogBody>
              {isTI && detalhe.status === "pendente" && (
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => { abrirAssinatura(detalhe); setDetalhe(null); }}>
                    <CheckCircle2 className="h-4 w-4" /> Registrar assinatura
                  </Button>
                  <Button variant="destructive" onClick={() => { abrirCancelar(detalhe); setDetalhe(null); }}>Cancelar termo</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modalAssinatura} onOpenChange={setModalAssinatura}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader><DialogTitle>Registrar assinatura</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">Termo de <strong className="text-foreground">{termoAcao?.funcionario_nome}</strong></p>
            <div>
              <label htmlFor="data-assinatura" className="mb-1.5 block text-sm font-medium">Data de assinatura</label>
              <Input id="data-assinatura" type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} />
            </div>
            <div>
              <label htmlFor="obs-assinatura" className="mb-1.5 block text-sm font-medium">Observações (opcional)</label>
              <Textarea id="obs-assinatura" rows={3} value={obsAssinatura} onChange={(e) => setObsAssinatura(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAssinatura(false)}>Voltar</Button>
            <Button disabled={salvando} className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground" onClick={registrarAssinatura}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar assinatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader><DialogTitle>Cancelar termo</DialogTitle></DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">Cancelar o termo de <strong className="text-foreground">{termoAcao?.funcionario_nome}</strong>?</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelar(false)}>Voltar</Button>
            <Button variant="destructive" disabled={salvando} onClick={cancelarTermo}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar termo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
