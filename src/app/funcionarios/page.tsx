"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { funcionarios, getFuncionarioById } from "@/lib/mock-data";
import type { AreaEmpresa } from "@/lib/mock-data";

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

function getInitials(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const selectClass =
  "border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#D42126]/20 focus:border-[#D42126] cursor-pointer";

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

  const hasFilters = busca || area !== "todas" || status !== "todos" || gestor !== "todos";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Funcionários</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {funcionarios.length} funcionários cadastrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="w-full border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D42126]/20 focus:border-[#D42126]"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
            <option value="todas">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="todos">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Desligado">Desligado</option>
          </select>

          <select value={gestor} onChange={(e) => setGestor(e.target.value)} className={selectClass}>
            <option value="todos">Todos os gestores</option>
            {gestores.map(
              (g) =>
                g && (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                )
            )}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setArea("todas");
                setStatus("todos");
                setGestor("todos");
              }}
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Nome
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Área
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Gestor
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Status
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-10 text-center text-sm text-[#9CA3AF]">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((func) => {
                const gestorNome = func.gestorId
                  ? getFuncionarioById(func.gestorId)?.nome
                  : "—";
                return (
                  <tr key={func.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#D42126] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {getInitials(func.nome)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#212121]">{func.nome}</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{func.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#374151]">{func.cargo}</td>
                    <td className="px-8 py-5">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
                        {func.area}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[#6B7280]">{gestorNome}</td>
                    <td className="px-8 py-5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          func.status === "Ativo"
                            ? "bg-[#DCFCE7] text-[#16A34A]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {func.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[#6B7280]">
                      {new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link
                        href={`/funcionarios/${func.id}`}
                        className="text-sm font-medium text-[#D42126] hover:underline"
                      >
                        Ver acessos
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-8 py-4 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
            Exibindo {filtered.length} de {funcionarios.length} funcionários
          </div>
        )}
      </div>
    </div>
  );
}
