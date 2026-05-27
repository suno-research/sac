"use client";
import Link from "next/link";
import { Users, Clock, AlertCircle, Grid, ArrowRight } from "lucide-react";
import {
  funcionarios,
  movimentacoes,
  offboardings,
  getFuncionarioById,
  countFuncionariosAtivos,
  countPendentesConcessao,
  countPendentesRemocao,
  ferramentas,
  acessos,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const totalAtivos = countFuncionariosAtivos();
  const pendentesConcessao = countPendentesConcessao();
  const pendentesRemocao = countPendentesRemocao();
  const totalFerramentas = ferramentas.length;

  const ultimasMovimentacoes = [...movimentacoes]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 6);

  const pendenciasMap = acessos
    .filter((a) => a.status === "Pendente concessão" || a.status === "Pendente remoção")
    .reduce<Record<string, { funcionarioId: string; tipos: string[] }>>((acc, a) => {
      if (!acc[a.funcionarioId]) acc[a.funcionarioId] = { funcionarioId: a.funcionarioId, tipos: [] };
      if (!acc[a.funcionarioId].tipos.includes(a.status)) acc[a.funcionarioId].tipos.push(a.status);
      return acc;
    }, {});
  const pendenciasList = Object.values(pendenciasMap).slice(0, 5);

  const offboardingsAbertos = offboardings.filter((o) => o.status === "Em andamento");

  const kpis = [
    { label: "Funcionários ativos", value: totalAtivos, icon: Users, iconColor: "text-blue-500", iconBg: "bg-blue-50" },
    { label: "Acessos a conceder", value: pendentesConcessao, icon: Clock, iconColor: "text-amber-500", iconBg: "bg-amber-50" },
    { label: "Acessos a remover", value: pendentesRemocao, icon: AlertCircle, iconColor: "text-red-500", iconBg: "bg-red-50" },
    { label: "Ferramentas cadastradas", value: totalFerramentas, icon: Grid, iconColor: "text-purple-500", iconBg: "bg-purple-50" },
  ];

  const statusColor: Record<string, string> = {
    "Concluído": "bg-green-100 text-green-700",
    "Em andamento": "bg-amber-100 text-amber-700",
    "Pendente": "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-8 max-w-[1280px]">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral do controle de acessos da Suno</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Banner offboarding em andamento */}
      {offboardingsAbertos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          {offboardingsAbertos.map((o) => {
            const func = getFuncionarioById(o.funcionarioId);
            return (
              <div key={o.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">Offboarding em andamento</p>
                    <p className="text-sm text-red-600">
                      {func?.nome} — iniciado em {new Date(o.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/offboarding/${o.id}`}
                  className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Ver checklist <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid de tabelas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Últimas movimentações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Últimas movimentações</h2>
            <Link href="/funcionarios" className="text-sm font-medium text-[#D42126] hover:underline">
              Ver todos →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasMovimentacoes.map((mov) => {
                const func = getFuncionarioById(mov.funcionarioId);
                return (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{func?.nome ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mov.tipo === "onboarding" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {mov.tipo === "onboarding" ? "Onboarding" : "Offboarding"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(mov.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[mov.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {mov.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pendências */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pendências de acesso</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {pendentesConcessao + pendentesRemocao} itens
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Área</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendenciasList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma pendência</td>
                </tr>
              ) : (
                pendenciasList.map((p) => {
                  const func = getFuncionarioById(p.funcionarioId);
                  return (
                    <tr key={p.funcionarioId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{func?.nome ?? "—"}</p>
                        <p className="text-xs text-slate-400">{func?.cargo}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{func?.area}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/funcionarios/${p.funcionarioId}`}
                          className="text-sm font-medium text-[#D42126] hover:underline"
                        >
                          Ver acessos →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funcionários recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Funcionários</h2>
          <Link href="/funcionarios" className="text-sm font-medium text-[#D42126] hover:underline">
            Ver todos →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Área</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {funcionarios.slice(0, 6).map((func) => {
              const initials = func.nome.split(" ").map((n) => n[0]).slice(0, 2).join("");
              return (
                <tr key={func.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#D42126] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{func.nome}</p>
                        <p className="text-xs text-slate-400">{func.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{func.cargo}</td>
                  <td className="px-4 py-3 text-slate-500">{func.area}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      func.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {func.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/funcionarios/${func.id}`}
                      className="text-sm font-medium text-[#D42126] hover:underline"
                    >
                      Ver acessos →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
