"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  SearchX,
  Undo2,
  XCircle,
} from "lucide-react";
import type { Alocacao, Ativo, StatusAlocacao } from "@/types/sec";
import {
  statusAlocacaoLabel,
  statusAlocacaoVariant,
  TODOS_STATUS_ALOCACAO,
} from "@/lib/sec-alocacoes";
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

type StatusAba = StatusAlocacao;

const ABAS: { key: StatusAba; label: string }[] = [
  { key: "ativa", label: "Ativas" },
  { key: "devolvida", label: "Devolvidas" },
  { key: "pendente", label: "Pendentes" },
  { key: "cancelada", label: "Canceladas" },
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = iso.includes("T")
    ? new Date(iso)
    : new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function AlocacoesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const isTI = session?.user?.role === "ti";

  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<StatusAba>("ativa");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  const [detalhe, setDetalhe] = useState<Alocacao | null>(null);
  const [modalDevolucao, setModalDevolucao] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [alocacaoAcao, setAlocacaoAcao] = useState<Alocacao | null>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sec/alocacoes").then((r) => r.json()),
      fetch("/api/sec/ativos").then((r) => r.json()),
    ])
      .then(([alocData, ativosData]) => {
        setAlocacoes(Array.isArray(alocData) ? alocData : []);
        setAtivos(Array.isArray(ativosData) ? ativosData : []);
      })
      .catch(() => {
        toast("Erro ao carregar alocações.", "error");
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const ativosPorId = useMemo(() => {
    const map = new Map<string, Ativo>();
    ativos.forEach((a) => map.set(a.equipamento_id, a));
    return map;
  }, [ativos]);

  const nomeEquipamento = (equipamentoId: string) =>
    ativosPorId.get(equipamentoId)?.nome ?? equipamentoId;

  const contagemPorStatus = useMemo(() => {
    const counts: Record<StatusAlocacao, number> = {
      ativa: 0,
      devolvida: 0,
      pendente: 0,
      cancelada: 0,
    };
    alocacoes.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  }, [alocacoes]);

  const listaAtual = useMemo(() => {
    if (statusFiltro !== "todos") {
      return alocacoes.filter((a) => a.status === statusFiltro);
    }
    return alocacoes.filter((a) => a.status === aba);
  }, [alocacoes, aba, statusFiltro]);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return listaAtual.filter((a) => {
      if (!q) return true;
      const nomeEquip = nomeEquipamento(a.equipamento_id).toLowerCase();
      return (
        a.funcionario_nome.toLowerCase().includes(q) ||
        a.funcionario_email.toLowerCase().includes(q) ||
        nomeEquip.includes(q) ||
        a.equipamento_id.toLowerCase().includes(q)
      );
    });
  }, [listaAtual, busca, nomeEquipamento]);

  const paginationKey = `${aba}|${statusFiltro}|${busca}|${pageSize}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const setCurrentPage = (page: number) => {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPageByKey((prev) => ({
      ...prev,
      [`${aba}|${statusFiltro}|${busca}|${size}`]: 1,
    }));
  };

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const hasFilters = Boolean(busca || statusFiltro !== "todos");

  const clearFilters = () => {
    setBusca("");
    setStatusFiltro("todos");
  };

  const atualizarAlocacaoLocal = (updated: Alocacao) => {
    setAlocacoes((prev) =>
      prev.map((a) => (a.alocacao_id === updated.alocacao_id ? updated : a))
    );
    setDetalhe((prev) =>
      prev?.alocacao_id === updated.alocacao_id ? updated : prev
    );
  };

  const abrirDevolucao = (alocacao: Alocacao, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAlocacaoAcao(alocacao);
    setMotivoDevolucao("");
    setModalDevolucao(true);
  };

  const abrirCancelar = (alocacao: Alocacao, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAlocacaoAcao(alocacao);
    setModalCancelar(true);
  };

  async function registrarDevolucao() {
    if (!alocacaoAcao) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sec/alocacoes/${alocacaoAcao.alocacao_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "devolvida",
          motivo_devolucao: motivoDevolucao.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao registrar devolução");
      }
      const updated = await res.json();
      atualizarAlocacaoLocal(updated);
      setModalDevolucao(false);
      setAlocacaoAcao(null);
      toast("Devolução registrada com sucesso.");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao registrar devolução.",
        "error"
      );
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarAlocacao() {
    if (!alocacaoAcao) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sec/alocacoes/${alocacaoAcao.alocacao_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelada" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao cancelar alocação");
      }
      const updated = await res.json();
      atualizarAlocacaoLocal(updated);
      setModalCancelar(false);
      setAlocacaoAcao(null);
      toast("Alocação cancelada.");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao cancelar alocação.",
        "error"
      );
    } finally {
      setSalvando(false);
    }
  }

  const emptyTitlePorAba: Record<StatusAba, string> = {
    ativa: "Nenhuma alocação ativa",
    devolvida: "Nenhuma devolução registrada",
    pendente: "Nenhuma alocação pendente",
    cancelada: "Nenhuma alocação cancelada",
  };

  const emptyDescPorAba: Record<StatusAba, string> = {
    ativa: "Registre uma entrega de equipamento para começar.",
    devolvida: "As devoluções concluídas aparecerão aqui.",
    pendente: "Alocações aguardando confirmação aparecerão aqui.",
    cancelada: "Alocações canceladas antes da entrega aparecerão aqui.",
  };

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Alocações" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  const semFiltrosENenhuma = alocacoes.length === 0 && !hasFilters;
  const abaAtual = statusFiltro !== "todos" ? (statusFiltro as StatusAba) : aba;

  return (
    <PageMotion>
      <PageHeader
        title="Alocações"
        description="Registro de entregas e devoluções de equipamentos."
        action={
          isTI ? (
            <Button
              onClick={() => router.push("/sec/alocacoes/nova")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Nova alocação
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAba(key);
              setStatusFiltro("todos");
            }}
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
        searchPlaceholder="Buscar por funcionário ou equipamento..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={clearFilters}
      >
        <FilterSelect
          value={statusFiltro}
          onChange={setStatusFiltro}
          aria-label="Filtrar por status"
        >
          <option value="todos">Todos os status</option>
          {TODOS_STATUS_ALOCACAO.map((s) => (
            <option key={s} value={s}>
              {statusAlocacaoLabel(s)}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      {semFiltrosENenhuma ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma alocação registrada"
            description="Registre a primeira entrega de equipamento."
            actionLabel={isTI ? "Nova alocação" : undefined}
            onAction={isTI ? () => router.push("/sec/alocacoes/nova") : undefined}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {(hasFilters || filtered.length > 0) && (
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5 sm:px-5">
              <p className="text-xs text-muted-foreground">
                {hasFilters ? (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {filtered.length}
                    </span>{" "}
                    resultado{filtered.length !== 1 ? "s" : ""} encontrado
                    {filtered.length !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {listaAtual.length}
                    </span>{" "}
                    alocaç{listaAtual.length !== 1 ? "ões" : "ão"} na lista
                  </>
                )}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[880px]">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">
                    Funcionário
                  </th>
                  <th className={thCompactMid} scope="col">
                    Equipamento
                  </th>
                  <th className={thCompactMid} scope="col">
                    Data alocação
                  </th>
                  <th className={thCompactMid} scope="col">
                    Devolução prevista
                  </th>
                  <th className={thCompactMid} scope="col">
                    Status
                  </th>
                  <th className={thCompactLast} scope="col">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      {hasFilters ? (
                        <EmptyState
                          icon={SearchX}
                          title="Nenhum resultado"
                          description="Tente ajustar a busca ou os filtros."
                          actionLabel="Limpar filtros"
                          onAction={clearFilters}
                        />
                      ) : (
                        <EmptyState
                          icon={ClipboardList}
                          title={emptyTitlePorAba[abaAtual]}
                          description={emptyDescPorAba[abaAtual]}
                          actionLabel={
                            isTI && abaAtual === "ativa"
                              ? "Nova alocação"
                              : undefined
                          }
                          onAction={
                            isTI && abaAtual === "ativa"
                              ? () => router.push("/sec/alocacoes/nova")
                              : undefined
                          }
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((alocacao) => (
                    <tr
                      key={alocacao.alocacao_id}
                      className={cn(trHover, "cursor-pointer")}
                      onClick={() => setDetalhe(alocacao)}
                    >
                      <td className={tdCompactName}>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {alocacao.funcionario_nome}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {alocacao.funcionario_email}
                          </p>
                        </div>
                      </td>
                      <td className={tdCompactText}>
                        <span
                          className="block truncate text-sm"
                          title={nomeEquipamento(alocacao.equipamento_id)}
                        >
                          {nomeEquipamento(alocacao.equipamento_id)}
                        </span>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {formatDate(alocacao.data_alocacao)}
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {formatDate(alocacao.data_devolucao_prevista)}
                      </td>
                      <td className={tdCompactText}>
                        <Badge
                          variant={statusAlocacaoVariant(alocacao.status)}
                          className="text-[11px]"
                        >
                          {statusAlocacaoLabel(alocacao.status)}
                        </Badge>
                      </td>
                      <td className={tdCompactActions}>
                        {isTI && (
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {alocacao.status === "ativa" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 px-2 text-xs"
                                title="Registrar devolução"
                                onClick={(e) => abrirDevolucao(alocacao, e)}
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Devolver</span>
                              </Button>
                            )}
                            {(alocacao.status === "ativa" ||
                              alocacao.status === "pendente") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive-muted hover:text-destructive"
                                title="Cancelar alocação"
                                aria-label={`Cancelar alocação de ${alocacao.funcionario_nome}`}
                                onClick={(e) => abrirCancelar(alocacao, e)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
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
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="alocações"
            />
          )}
        </div>
      )}

      {/* Modal de detalhe */}
      <Dialog open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhe da alocação</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <>
              <DialogBody className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Funcionário" value={detalhe.funcionario_nome} />
                <DetailField label="E-mail" value={detalhe.funcionario_email} />
                <DetailField
                  label="Equipamento"
                  value={nomeEquipamento(detalhe.equipamento_id)}
                />
                <DetailField label="ID equipamento" value={detalhe.equipamento_id} />
                <DetailField
                  label="Status"
                  value={
                    <Badge variant={statusAlocacaoVariant(detalhe.status)}>
                      {statusAlocacaoLabel(detalhe.status)}
                    </Badge>
                  }
                />
                <DetailField
                  label="Data alocação"
                  value={formatDate(detalhe.data_alocacao)}
                />
                <DetailField
                  label="Devolução prevista"
                  value={formatDate(detalhe.data_devolucao_prevista)}
                />
                <DetailField
                  label="Devolução real"
                  value={formatDate(detalhe.data_devolucao_real)}
                />
                {detalhe.termo_id && (
                  <DetailField label="Termo" value={detalhe.termo_id} />
                )}
                {detalhe.motivo_devolucao && (
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Motivo da devolução"
                      value={detalhe.motivo_devolucao}
                    />
                  </div>
                )}
                {detalhe.observacoes && (
                  <div className="sm:col-span-2">
                    <DetailField label="Observações" value={detalhe.observacoes} />
                  </div>
                )}
              </DialogBody>
              {isTI &&
                (detalhe.status === "ativa" ||
                  detalhe.status === "pendente") && (
                  <DialogFooter className="flex-wrap gap-2 sm:gap-0">
                    {detalhe.status === "ativa" && (
                      <>
                        <Button variant="outline" className="gap-2" asChild>
                          <Link
                            href={`/sec/termos/novo?alocacao_id=${detalhe.alocacao_id}`}
                            onClick={() => setDetalhe(null)}
                          >
                            <FileText className="h-4 w-4" />
                            Emitir termo
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            abrirDevolucao(detalhe);
                            setDetalhe(null);
                          }}
                        >
                          <Undo2 className="h-4 w-4" />
                          Registrar devolução
                        </Button>
                      </>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        abrirCancelar(detalhe);
                        setDetalhe(null);
                      }}
                    >
                      Cancelar alocação
                    </Button>
                  </DialogFooter>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal devolução */}
      <Dialog open={modalDevolucao} onOpenChange={setModalDevolucao}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Registrar devolução</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirmar devolução do equipamento{" "}
              <strong className="text-foreground">
                {alocacaoAcao
                  ? nomeEquipamento(alocacaoAcao.equipamento_id)
                  : ""}
              </strong>{" "}
              por{" "}
              <strong className="text-foreground">
                {alocacaoAcao?.funcionario_nome}
              </strong>
              .
            </p>
            <div>
              <label
                htmlFor="motivo-devolucao"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Motivo (opcional)
              </label>
              <Textarea
                id="motivo-devolucao"
                value={motivoDevolucao}
                onChange={(e) => setMotivoDevolucao(e.target.value)}
                placeholder="Ex.: fim de contrato, troca de equipamento..."
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDevolucao(false)}>
              Voltar
            </Button>
            <Button
              disabled={salvando}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
              onClick={registrarDevolucao}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar devolução"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cancelar */}
      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cancelar alocação</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar a alocação de{" "}
              <strong className="text-foreground">
                {alocacaoAcao?.funcionario_nome}
              </strong>
              ? Esta ação não pode ser desfeita.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelar(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={salvando}
              onClick={cancelarAlocacao}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancelar alocação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
