"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Loader2,
  ShieldCheck,
  SearchX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  ArrowDownToLine,
} from "lucide-react";
import type { Ativo, Patrimonio, StatusPatrimonio } from "@/types/sec";
import {
  statusPatrimonioLabel,
  statusPatrimonioVariant,
} from "@/lib/sec-patrimonio";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactName,
  tdCompactText,
  tdCompactCargo,
  tdCompactActions,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/ui/filter-bar";
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

type StatusAba = StatusPatrimonio;
type SortKey = "numero_patrimonio" | "data_tombamento" | "valor_tombamento";

function formatValor(value?: string): string {
  return value
    ? `R$ ${parseFloat(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "—";
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground"
      )}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <Icon className="h-3.5 w-3.5 opacity-60" aria-hidden />
    </button>
  );
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

const ABAS: { key: StatusAba; label: string }[] = [
  { key: "ativo", label: "Ativos" },
  { key: "em_analise", label: "Em análise" },
  { key: "baixado", label: "Baixados" },
];

export default function PatrimonioPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";
  const router = useRouter();

  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [ativosMap, setAtivosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<StatusAba>("ativo");
  const [busca, setBusca] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<SortKey>("numero_patrimonio");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [modalBaixa, setModalBaixa] = useState(false);
  const [patrimonioBaixa, setPatrimonioBaixa] = useState<Patrimonio | null>(null);
  const [dataBaixa, setDataBaixa] = useState("");
  const [motivoBaixa, setMotivoBaixa] = useState("");
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sec/patrimonio").then((r) => r.json()),
      fetch("/api/sec/ativos").then((r) => r.json()),
    ])
      .then(([pats, ativos]) => {
        setPatrimonios(Array.isArray(pats) ? pats : []);
        const map: Record<string, string> = {};
        if (Array.isArray(ativos)) {
          (ativos as Ativo[]).forEach((a) => {
            map[a.equipamento_id] = a.nome;
          });
        }
        setAtivosMap(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const contagemPorStatus = useMemo(() => {
    const counts: Record<StatusPatrimonio, number> = {
      ativo: 0,
      em_analise: 0,
      baixado: 0,
    };
    patrimonios.forEach((p) => counts[p.status]++);
    return counts;
  }, [patrimonios]);

  const listaAtual = useMemo(
    () => patrimonios.filter((p) => p.status === aba),
    [patrimonios, aba]
  );

  const filtered = useMemo(() => {
    const q = busca.toLowerCase();
    return listaAtual.filter((p) => {
      const nomeEquip = ativosMap[p.equipamento_id] ?? "";
      return (
        !q ||
        p.numero_patrimonio.toLowerCase().includes(q) ||
        p.equipamento_id.toLowerCase().includes(q) ||
        nomeEquip.toLowerCase().includes(q)
      );
    });
  }, [listaAtual, busca, ativosMap]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "numero_patrimonio":
          cmp = a.numero_patrimonio.localeCompare(b.numero_patrimonio, "pt-BR");
          break;
        case "data_tombamento":
          cmp = a.data_tombamento.localeCompare(b.data_tombamento);
          break;
        case "valor_tombamento":
          cmp = (a.valor_tombamento ?? "").localeCompare(b.valor_tombamento ?? "");
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const paginationKey = `${aba}|${busca}|${pageSize}|${sortKey}|${sortDir}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const hasFilters = Boolean(busca);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function confirmarBaixa() {
    if (!patrimonioBaixa || !dataBaixa || !motivoBaixa.trim()) {
      toast("Preencha data e motivo da baixa.", "error");
      return;
    }
    setBaixando(true);
    try {
      const res = await fetch(
        `/api/sec/patrimonio/${patrimonioBaixa.patrimonio_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "baixado",
            data_baixa: dataBaixa,
            motivo_baixa: motivoBaixa.trim(),
          }),
        }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPatrimonios((prev) =>
        prev.map((p) =>
          p.patrimonio_id === updated.patrimonio_id ? updated : p
        )
      );
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
        <PageHeader title="Patrimônio" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Patrimônio"
        description="Tombamento oficial de equipamentos patrimoniais."
        action={
          isTI ? (
            <Button
              onClick={() => router.push("/sec/patrimonio/novo")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Novo patrimônio
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setAba(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 sm:px-5",
              aba === key
                ? "bg-blue-500 text-white shadow-sm dark:bg-blue-400 dark:text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {label} ({contagemPorStatus[key]})
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Buscar por número, equipamento ou nome..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={() => setBusca("")}
      />

      {patrimonios.length === 0 && !hasFilters ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={ShieldCheck}
            title="Nenhum patrimônio cadastrado"
            description="Registre o primeiro tombamento para começar."
            actionLabel={isTI ? "Novo patrimônio" : undefined}
            onAction={isTI ? () => router.push("/sec/patrimonio/novo") : undefined}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[880px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst}>
                    <SortableHeader
                      label="Nº Patrimônio"
                      sortKey="numero_patrimonio"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid}>Equipamento</th>
                  <th className={thCompactMid}>Status</th>
                  <th className={thCompactMid}>
                    <SortableHeader
                      label="Data tombamento"
                      sortKey="data_tombamento"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactMid}>
                    <SortableHeader
                      label="Valor"
                      sortKey="valor_tombamento"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={thCompactLast}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="Nenhum resultado"
                        description="Tente ajustar a busca."
                        actionLabel="Limpar filtros"
                        onAction={() => setBusca("")}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr
                      key={p.patrimonio_id}
                      className={cn(trHover, "cursor-pointer", p.status === "baixado" && "opacity-60")}
                      onClick={() => router.push(`/sec/patrimonio/${p.patrimonio_id}`)}
                    >
                      <td className={tdCompactName}>
                        <span className="font-medium text-foreground">{p.numero_patrimonio}</span>
                      </td>
                      <td className={tdCompactCargo}>
                        <span className="block truncate">
                          {ativosMap[p.equipamento_id] ?? p.equipamento_id}
                        </span>
                      </td>
                      <td className={tdCompactText}>
                        <Badge variant={statusPatrimonioVariant(p.status)} className="text-[11px]">
                          {statusPatrimonioLabel(p.status)}
                        </Badge>
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {new Date(p.data_tombamento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className={cn(tdCompactText, "tabular-nums text-xs")}>
                        {formatValor(p.valor_tombamento)}
                      </td>
                      <td className={tdCompactActions} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                            <Link href={`/sec/patrimonio/${p.patrimonio_id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isTI && p.status !== "baixado" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Baixar patrimônio"
                              onClick={() => {
                                setPatrimonioBaixa(p);
                                setDataBaixa(new Date().toISOString().split("T")[0]);
                                setMotivoBaixa("");
                                setModalBaixa(true);
                              }}
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
              onPageChange={(page) =>
                setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }))
              }
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: 1 }));
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="registros"
            />
          )}
        </div>
      )}

      <Dialog open={modalBaixa} onOpenChange={setModalBaixa}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Baixar patrimônio</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Baixar patrimônio <strong>{patrimonioBaixa?.numero_patrimonio}</strong>
            </p>
            <div>
              <label className="text-sm font-medium">Data da baixa</label>
              <Input
                type="date"
                className="mt-1.5"
                value={dataBaixa}
                onChange={(e) => setDataBaixa(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motivo da baixa</label>
              <Textarea
                rows={3}
                className="mt-1.5"
                value={motivoBaixa}
                onChange={(e) => setMotivoBaixa(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBaixa(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={baixando || !dataBaixa || !motivoBaixa.trim()}
              onClick={confirmarBaixa}
            >
              {baixando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
