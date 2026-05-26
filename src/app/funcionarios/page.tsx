"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusFuncionarioBadge } from "@/components/layout/StatusBadge";
import { funcionarios, getFuncionarioById } from "@/lib/mock-data";
import type { AreaEmpresa, StatusFuncionario } from "@/lib/mock-data";

const areas: AreaEmpresa[] = ["TI", "Marketing", "Financeiro", "Editorial", "Comercial", "RH", "Jurídico", "Operações"];

export default function FuncionariosPage() {
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [status, setStatus] = useState<string>("todos");
  const [gestor, setGestor] = useState<string>("todos");

  const gestores = useMemo(() => {
    const ids = [...new Set(funcionarios.map((f) => f.gestorId).filter(Boolean))] as string[];
    return ids.map((id) => getFuncionarioById(id)).filter(Boolean);
  }, []);

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
  }, [busca, area, status, gestor]);

  return (
    <div className="p-6 space-y-5 max-w-[1280px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Funcionários</h1>
          <p className="text-sm text-gray-500 mt-0.5">{funcionarios.length} funcionários cadastrados</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Filtros:</span>
            </div>

            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as áreas</SelectItem>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Desligado">Desligado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gestor} onValueChange={setGestor}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os gestores</SelectItem>
                {gestores.map((g) => g && (
                  <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(busca || area !== "todas" || status !== "todos" || gestor !== "todos") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => { setBusca(""); setArea("todas"); setStatus("todos"); setGestor("todos"); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDDD]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Área</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Gestor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Entrada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">Nenhum funcionário encontrado.</td></tr>
                ) : (
                  filtered.map((func) => {
                    const gestorNome = func.gestorId ? getFuncionarioById(func.gestorId)?.nome : "—";
                    return (
                      <tr key={func.id} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{func.nome}</p>
                          <p className="text-xs text-gray-400">{func.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{func.cargo}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {func.area}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{gestorNome}</td>
                        <td className="px-4 py-3"><StatusFuncionarioBadge status={func.status} /></td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/funcionarios/${func.id}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                              Ver acessos <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-[#DDDDDD] text-xs text-gray-400">
              Exibindo {filtered.length} de {funcionarios.length} funcionários
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
