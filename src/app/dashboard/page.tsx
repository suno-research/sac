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

const thClass =
  "px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap";
const tdClass = "px-6 py-4 text-sm whitespace-nowrap";

function getInitials(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
    {
      label: "Funcionários ativos",
      value: totalAtivos,
      icon: Users,
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#3B82F6]",
    },
    {
      label: "Acessos a conceder",
      value: pendentesConcessao,
      icon: Clock,
      iconBg: "bg-[#FEF3C7]",
      iconColor: "text-[#D97706]",
    },
    {
      label: "Acessos a remover",
      value: pendentesRemocao,
      icon: AlertCircle,
      iconBg: "bg-[#FEF2F2]",
      iconColor: "text-[#D42126]",
    },
    {
      label: "Ferramentas cadastradas",
      value: totalFerramentas,
      icon: Grid,
      iconBg: "bg-[#F3F4F6]",
      iconColor: "text-[#6B7280]",
    },
  ];

  const statusBadge: Record<string, string> = {
    Concluído: "bg-[#DCFCE7] text-[#16A34A]",
    "Em andamento": "bg-[#FEF3C7] text-[#D97706]",
    Pendente: "bg-[#F3F4F6] text-[#6B7280]",
  };

  return (
    <div className="space-y-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">Visão geral do controle de acessos da Suno</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 min-h-[140px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-end">
              <div className={`p-3 rounded-2xl ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#111827] mt-6">{kpi.value}</p>
              <p className="text-sm text-[#6B7280] mt-1">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {offboardingsAbertos.length > 0 && (
        <div className="space-y-3">
          {offboardingsAbertos.map((o) => {
            const func = getFuncionarioById(o.funcionarioId);
            return (
              <div
                key={o.id}
                className="bg-[#FEF2F2] border border-[#FECACA] border-l-4 border-l-[#D42126] rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-[#D42126] flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#111827]">Offboarding em andamento</p>
                      <p className="text-sm text-[#6B7280] mt-0.5">
                        {func?.nome} — iniciado em{" "}
                        {new Date(o.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/offboarding/${o.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-[#D42126] hover:underline"
                  >
                    Ver checklist <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-[#F3F4F6] flex justify-between items-center">
            <h2 className="text-base font-semibold text-[#111827]">Últimas movimentações</h2>
            <Link href="/funcionarios" className="text-sm font-medium text-[#D42126] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className={thClass}>Funcionário</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {ultimasMovimentacoes.map((mov) => {
                  const func = getFuncionarioById(mov.funcionarioId);
                  return (
                    <tr key={mov.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          {func && (
                            <div className="h-9 w-9 rounded-full bg-[#D42126] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {getInitials(func.nome)}
                            </div>
                          )}
                          <span className="font-medium text-[#111827]">{func?.nome ?? "—"}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            mov.tipo === "onboarding"
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : "bg-[#FEF2F2] text-[#D42126]"
                          }`}
                        >
                          {mov.tipo === "onboarding" ? "Onboarding" : "Offboarding"}
                        </span>
                      </td>
                      <td className={`${tdClass} text-[#6B7280]`}>
                        {new Date(mov.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusBadge[mov.status] ?? "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {mov.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-[#F3F4F6] flex justify-between items-center">
            <h2 className="text-base font-semibold text-[#111827]">Pendências de acesso</h2>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#D97706]">
              {pendentesConcessao + pendentesRemocao} itens
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className={`${thClass} min-w-[200px]`}>Funcionário</th>
                  <th className={thClass}>Área</th>
                  <th className={thClass}>Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {pendenciasList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-[#9CA3AF]">
                      Nenhuma pendência
                    </td>
                  </tr>
                ) : (
                  pendenciasList.map((p) => {
                    const func = getFuncionarioById(p.funcionarioId);
                    return (
                      <tr key={p.funcionarioId} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className={`${tdClass} min-w-[200px]`}>
                          <div className="flex items-center gap-3">
                            {func && (
                              <div className="h-9 w-9 rounded-full bg-[#D42126] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {getInitials(func.nome)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-[#111827]">{func?.nome ?? "—"}</p>
                              <p className="text-xs text-[#9CA3AF]">{func?.cargo}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdClass} text-[#6B7280]`}>{func?.area}</td>
                        <td className={tdClass}>
                          <Link
                            href={`/funcionarios/${p.funcionarioId}`}
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
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-[#F3F4F6] flex justify-between items-center">
          <h2 className="text-base font-semibold text-[#111827]">Funcionários</h2>
          <Link href="/funcionarios" className="text-sm font-medium text-[#D42126] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className={`${thClass} min-w-[200px]`}>Nome</th>
                <th className={thClass}>Cargo</th>
                <th className={thClass}>Área</th>
                <th className={thClass}>Status</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {funcionarios.slice(0, 6).map((func) => (
                <tr key={func.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className={`${tdClass} min-w-[200px]`}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#D42126] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(func.nome)}
                      </div>
                      <div>
                        <p className="font-medium text-[#111827]">{func.nome}</p>
                        <p className="text-xs text-[#9CA3AF]">{func.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-[#374151]`}>{func.cargo}</td>
                  <td className={`${tdClass} text-[#6B7280]`}>{func.area}</td>
                  <td className={tdClass}>
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
                  <td className={`${tdClass} text-right`}>
                    <Link
                      href={`/funcionarios/${func.id}`}
                      className="text-sm font-medium text-[#D42126] hover:underline"
                    >
                      Ver acessos
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
