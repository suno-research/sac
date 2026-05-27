import Link from "next/link";
import { Users, Clock, AlertCircle, Wrench, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusMovimentacaoBadge, StatusFuncionarioBadge } from "@/components/layout/StatusBadge";
import {
  funcionarios,
  movimentacoes,
  ferramentas,
  offboardings,
  getFuncionarioById,
  countFuncionariosAtivos,
  countPendentesConcessao,
  countPendentesRemocao,
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

  // Pendências: acessos pendentes agrupados por funcionário
  const pendencias = acessos
    .filter((a) => a.status === "Pendente concessão" || a.status === "Pendente remoção")
    .reduce<Record<string, { funcionarioId: string; tipos: string[] }>>((acc, a) => {
      if (!acc[a.funcionarioId]) acc[a.funcionarioId] = { funcionarioId: a.funcionarioId, tipos: [] };
      if (!acc[a.funcionarioId].tipos.includes(a.status)) acc[a.funcionarioId].tipos.push(a.status);
      return acc;
    }, {});

  const pendenciasList = Object.values(pendencias).slice(0, 5);

  const kpis = [
    { label: "Funcionários ativos", value: totalAtivos, icon: Users, iconColor: "text-[#16a34a]", iconBg: "bg-green-50" },
    { label: "Acessos a conceder", value: pendentesConcessao, icon: Clock, iconColor: "text-[#d97706]", iconBg: "bg-yellow-50" },
    { label: "Acessos a remover", value: pendentesRemocao, icon: AlertCircle, iconColor: "text-[#D42126]", iconBg: "bg-red-50" },
    { label: "Ferramentas cadastradas", value: totalFerramentas, icon: Wrench, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
  ];

  const offboardingsAbertos = offboardings.filter((o) => o.status === "Em andamento");

  return (
    <div className="p-6 space-y-6 max-w-[1280px]">
      {/* Título */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do controle de acessos da Suno</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Offboardings em aberto */}
      {offboardingsAbertos.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {offboardingsAbertos.length} offboarding{offboardingsAbertos.length > 1 ? "s" : ""} em andamento
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {offboardingsAbertos.map((o) => getFuncionarioById(o.funcionarioId)?.nome).join(", ")}
              </p>
            </div>
          </div>
          {offboardingsAbertos.map((o) => (
            <Link key={o.id} href={`/offboarding/${o.id}`}>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 shrink-0">
                Ver checklist <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimas movimentações */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900">Últimas movimentações</CardTitle>
              <Link href="/funcionarios">
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-700">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDDD]">
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Funcionário</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimasMovimentacoes.map((mov) => {
                  const func = getFuncionarioById(mov.funcionarioId);
                  return (
                    <tr key={mov.id} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{func?.nome ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={mov.tipo === "onboarding" ? "success" : "destructive"}>
                          {mov.tipo === "onboarding" ? "Onboarding" : "Offboarding"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(mov.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusMovimentacaoBadge status={mov.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pendências */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900">Pendências de acesso</CardTitle>
              <Badge variant="warning">{pendentesConcessao + pendentesRemocao} itens</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendenciasList.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Nenhuma pendência 🎉</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DDDDDD]">
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Funcionário</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Área</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendenciasList.map((p) => {
                    const func = getFuncionarioById(p.funcionarioId);
                    return (
                      <tr key={p.funcionarioId} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{func?.nome ?? "—"}</p>
                          <p className="text-xs text-gray-400">{func?.cargo}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{func?.area}</td>
                        <td className="px-4 py-3">
                          <Link href={`/funcionarios/${p.funcionarioId}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              Ver acessos <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funcionários recentes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900">Funcionários</CardTitle>
            <Link href="/funcionarios">
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-700">
                Ver todos <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDDDDD]">
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Cargo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Área</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.slice(0, 6).map((func) => (
                <tr key={func.id} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{func.nome}</p>
                    <p className="text-xs text-gray-400">{func.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{func.cargo}</td>
                  <td className="px-4 py-3 text-gray-500">{func.area}</td>
                  <td className="px-4 py-3"><StatusFuncionarioBadge status={func.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/funcionarios/${func.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-[#D42126] hover:text-[#D42126] hover:bg-red-50">
                        Ver acessos
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
