"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { History, Loader2 } from "lucide-react";
import type { SECAuditLog } from "@/types/sec";
import {
  thCompactFirst,
  thCompactMid,
  thCompactLast,
  tdCompactText,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageMotion } from "@/components/ui/page-motion";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const ENTIDADES = [
  "EQUIPAMENTOS",
  "ALOCACOES",
  "PATRIMONIO",
  "ESTOQUE",
  "TERMOS",
] as const;

const ACOES = ["CREATE", "UPDATE", "DELETE"] as const;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function acaoVariant(
  acao: SECAuditLog["acao"]
): "success" | "default" | "destructive" {
  if (acao === "CREATE") return "success";
  if (acao === "DELETE") return "destructive";
  return "default";
}

export default function AuditoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isTI = session?.user?.role === "ti";

  const [logs, setLogs] = useState<SECAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("todos");
  const [filtroAcao, setFiltroAcao] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [pageSize, setPageSize] = useState(25);
  const [currentPageByKey, setCurrentPageByKey] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/dashboard");
  }, [isTI, status, router]);

  useEffect(() => {
    if (!isTI) return;
    fetch("/api/sec/auditoria")
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isTI]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return logs.filter((log) => {
      if (filtroEntidade !== "todos" && log.entidade !== filtroEntidade)
        return false;
      if (filtroAcao !== "todos" && log.acao !== filtroAcao) return false;
      if (filtroOrigem !== "todos" && (log.origem ?? "app") !== filtroOrigem)
        return false;
      if (!q) return true;
      return (
        log.entidade_id.toLowerCase().includes(q) ||
        log.usuario_email.toLowerCase().includes(q) ||
        (log.usuario_nome?.toLowerCase().includes(q) ?? false) ||
        (log.observacao?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [logs, busca, filtroEntidade, filtroAcao, filtroOrigem]);

  const paginationKey = `${busca}|${filtroEntidade}|${filtroAcao}|${filtroOrigem}|${pageSize}`;
  const currentPage = currentPageByKey[paginationKey] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginados = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, safePage, pageSize]);

  function setCurrentPage(page: number) {
    setCurrentPageByKey((prev) => ({ ...prev, [paginationKey]: page }));
  }

  const hasFilters =
    Boolean(busca) ||
    filtroEntidade !== "todos" ||
    filtroAcao !== "todos" ||
    filtroOrigem !== "todos";

  if (status === "loading" || !isTI) {
    return (
      <PageMotion>
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Auditoria"
        description="Trilha completa de ações realizadas no módulo SEC."
      />

      <FilterBar
        searchPlaceholder="Buscar por ID, usuário ou observação…"
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={() => {
          setBusca("");
          setFiltroEntidade("todos");
          setFiltroAcao("todos");
          setFiltroOrigem("todos");
        }}
      >
        <FilterSelect
          value={filtroEntidade}
          onChange={setFiltroEntidade}
          aria-label="Filtrar por entidade"
        >
          <option value="todos">Todas as entidades</option>
          {ENTIDADES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filtroAcao}
          onChange={setFiltroAcao}
          aria-label="Filtrar por ação"
        >
          <option value="todos">Todas as ações</option>
          {ACOES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filtroOrigem}
          onChange={setFiltroOrigem}
          aria-label="Filtrar por origem"
        >
          <option value="todos">Todas as origens</option>
          <option value="app">app</option>
          <option value="n8n">n8n</option>
        </FilterSelect>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum registro de auditoria"
          description="As ações realizadas no SEC aparecerão aqui."
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden max-lg:overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className={thCompactFirst} scope="col">
                    Data/hora
                  </th>
                  <th className={thCompactMid} scope="col">
                    Entidade
                  </th>
                  <th className={thCompactMid} scope="col">
                    ID
                  </th>
                  <th className={thCompactMid} scope="col">
                    Ação
                  </th>
                  <th className={thCompactMid} scope="col">
                    Campo
                  </th>
                  <th className={thCompactMid} scope="col">
                    Usuário
                  </th>
                  <th className={thCompactMid} scope="col">
                    Origem
                  </th>
                  <th className={thCompactLast} scope="col">
                    Obs.
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((log) => (
                  <tr key={log.audit_id} className={trHover}>
                    <td className={`${tdCompactText} tabular-nums text-xs whitespace-nowrap`}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className={tdCompactText}>
                      <span className="text-xs font-medium">{log.entidade}</span>
                    </td>
                    <td className={tdCompactText}>
                      <span className="text-xs font-mono truncate block max-w-[120px]">
                        {log.entidade_id}
                      </span>
                    </td>
                    <td className={tdCompactText}>
                      <Badge variant={acaoVariant(log.acao)} className="text-[11px]">
                        {log.acao}
                      </Badge>
                    </td>
                    <td className={tdCompactText}>
                      <span className="text-xs truncate block max-w-[100px]">
                        {log.campo_alterado || "—"}
                      </span>
                    </td>
                    <td className={tdCompactText}>
                      <div className="min-w-0">
                        <p className="text-xs truncate">{log.usuario_email}</p>
                        {log.usuario_nome && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {log.usuario_nome}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={tdCompactText}>
                      <Badge
                        variant={log.origem === "n8n" ? "warning" : "muted"}
                        className="text-[11px]"
                      >
                        {log.origem ?? "app"}
                      </Badge>
                    </td>
                    <td className={tdCompactText}>
                      <span className="text-xs truncate block max-w-[140px]">
                        {log.observacao || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            totalItems={filtrados.length}
            currentPage={safePage}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="registros"
          />
        </>
      )}
    </PageMotion>
  );
}
