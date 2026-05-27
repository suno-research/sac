"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import type { Funcionario, AreaEmpresa } from "@/lib/mock-data";
import {
  thFirst,
  thMid,
  thLast,
  tdName,
  tdCargo,
  tdMid,
  tdLast,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { Avatar } from "@/components/ui/avatar";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const areas: AreaEmpresa[] = [
  "TI",
  "Marketing",
  "Financeiro",
  "Editorial",
  "Comercial",
  "RH",
  "Jurídico",
  "Operações",
];

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden p-6 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 48, background: "#F3F4F6", borderRadius: 8 }} />
      ))}
    </div>
  );
}

export default function FuncionariosPage() {
  const { data: session } = useSession();
  const isGestor = session?.user?.role === "gestor";
  const userEmail = session?.user?.email || "";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [status, setStatus] = useState<string>("todos");
  const [gestor, setGestor] = useState<string>("todos");

  useEffect(() => {
    fetch("/api/funcionarios")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as Funcionario[]) : [];
        if (isGestor) {
          const gestorRecord = list.find((f) => f.email === userEmail);
          if (gestorRecord) {
            setFuncionarios(list.filter((f) => f.gestorId === gestorRecord.id));
          } else {
            setFuncionarios([]);
          }
        } else {
          setFuncionarios(list);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isGestor, userEmail]);

  const getFuncionarioById = useMemo(() => {
    const map = new Map(funcionarios.map((f) => [f.id, f]));
    return (id: string) => map.get(id);
  }, [funcionarios]);

  const gestores = useMemo(() => {
    const ids = [...new Set(funcionarios.map((f) => f.gestorId).filter(Boolean))] as string[];
    return ids.map((id) => getFuncionarioById(id)).filter(Boolean);
  }, [funcionarios, getFuncionarioById]);

  const filtered = useMemo(() => {
    return funcionarios.filter((f) => {
      const matchBusca =
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.email.toLowerCase().includes(busca.toLowerCase());
      const matchArea = area === "todas" || f.area === area;
      const matchStatus = status === "todos" || f.status === status;
      const matchGestor = gestor === "todos" || f.gestorId === gestor;
      return matchBusca && matchArea && matchStatus && matchGestor;
    });
  }, [funcionarios, busca, area, status, gestor]);

  const hasFilters = busca || area !== "todas" || status !== "todos" || gestor !== "todos";

  const clearFilters = () => {
    setBusca("");
    setArea("todas");
    setStatus("todos");
    setGestor("todos");
  };

  if (loading) {
    return (
      <PageMotion>
        <PageHeader title="Funcionários" description="Carregando..." />
        <TableSkeleton />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        title="Funcionários"
        description={
          isGestor
            ? `${funcionarios.length} membros do seu time`
            : `${funcionarios.length} funcionários cadastrados`
        }
      />

      <FilterBar
        searchPlaceholder="Buscar por nome ou email..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={clearFilters}
      >
        <FilterSelect value={area} onChange={setArea}>
          <option value="todas">Todas as áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus}>
          <option value="todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Desligado">Desligado</option>
        </FilterSelect>
        <FilterSelect value={gestor} onChange={setGestor}>
          <option value="todos">Todos os gestores</option>
          {gestores.map(
            (g) =>
              g && (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              )
          )}
        </FilterSelect>
      </FilterBar>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className={thFirst}>Nome</th>
              <th className={`${thMid} min-w-[220px]`}>Cargo</th>
              <th className={thMid}>Área</th>
              <th className={thMid}>Gestor</th>
              <th className={thMid}>Status</th>
              <th className={thMid}>Entrada</th>
              <th className={thLast} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="pl-10 pr-10 py-14 text-center text-[15px] text-muted-foreground">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((func) => {
                const gestorNome = func.gestorId ? getFuncionarioById(func.gestorId)?.nome : "—";
                return (
                  <tr key={func.id} className={trHover}>
                    <td className={tdName}>
                      <div className="flex items-center gap-4">
                        <Avatar name={func.nome} size="md" />
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{func.nome}</p>
                          <p className="text-xs text-muted-foreground">{func.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdCargo}>{func.cargo}</td>
                    <td className={tdMid}>
                      <Badge variant="secondary">{func.area}</Badge>
                    </td>
                    <td className={tdMid}>{gestorNome}</td>
                    <td className={tdMid}>
                      <Badge variant={func.status === "Ativo" ? "success" : "muted"}>{func.status}</Badge>
                    </td>
                    <td className={tdMid}>
                      {new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className={`${tdLast} text-right`}>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/funcionarios/${func.id}`}>
                          Ver acessos <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-10 py-5 border-t border-border text-sm text-muted-foreground">
            Exibindo {filtered.length} de {funcionarios.length} funcionários
          </div>
        )}
      </div>
    </PageMotion>
  );
}
