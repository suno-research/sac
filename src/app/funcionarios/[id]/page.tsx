import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, Building2, User, ExternalLink, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusFuncionarioBadge, StatusAcessoBadge } from "@/components/layout/StatusBadge";
import {
  getFuncionarioById,
  getAcessosByFuncionario,
  getFerramentaById,
  getOffboardingByFuncionario,
  getFuncionarioById as getNome,
  offboardings,
} from "@/lib/mock-data";

export default function FuncionarioDetailPage({ params }: { params: { id: string } }) {
  const func = getFuncionarioById(params.id);
  if (!func) notFound();

  const acessos = getAcessosByFuncionario(func.id);
  const gestorNome = func.gestorId ? getNome(func.gestorId)?.nome : null;
  const offboarding = offboardings.find((o) => o.funcionarioId === func.id);

  // Agrupar acessos por status
  const grupos: Record<string, typeof acessos> = {
    "Ativo": [],
    "Pendente concessão": [],
    "Pendente remoção": [],
    "Sem acesso": [],
  };
  acessos.forEach((a) => grupos[a.status]?.push(a));

  const statsSummary = [
    { label: "Ativos", count: grupos["Ativo"].length, color: "text-[#16a34a] bg-green-50" },
    { label: "Pend. concessão", count: grupos["Pendente concessão"].length, color: "text-[#f59e0b] bg-yellow-50" },
    { label: "Pend. remoção", count: grupos["Pendente remoção"].length, color: "text-[#D42126] bg-red-50" },
    { label: "Sem acesso", count: grupos["Sem acesso"].length, color: "text-gray-400 bg-gray-50" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/funcionarios">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900 pl-0">
            <ArrowLeft className="h-4 w-4" /> Funcionários
          </Button>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">{func.nome}</span>
      </div>

      {/* Header do funcionário */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D42126]/10 text-[#D42126] text-xl font-semibold flex-shrink-0">
                {func.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{func.nome}</h1>
                <p className="text-sm text-gray-500">{func.cargo}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <StatusFuncionarioBadge status={func.status} />
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Building2 className="h-3 w-3" /> {func.area}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3 w-3" /> {func.email}
                  </span>
                  {gestorNome && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <User className="h-3 w-3" /> {gestorNome}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" /> Desde {new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 flex-wrap">
              {func.status === "Ativo" && !offboarding && (
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" /> Iniciar Offboarding
                </Button>
              )}
              {offboarding && offboarding.status === "Em andamento" && (
                <Link href={`/offboarding/${offboarding.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-yellow-300 text-yellow-800 hover:bg-yellow-50">
                    <ClipboardList className="h-4 w-4" /> Ver checklist de offboarding
                  </Button>
                </Link>
              )}
              {offboarding && offboarding.status === "Concluído" && (
                <Link href={`/offboarding/${offboarding.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ClipboardList className="h-4 w-4" /> Ver offboarding concluído
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats de acesso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#DDDDDD]">
            {statsSummary.map((s) => (
              <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de acessos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">
            Ferramentas e acessos ({acessos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDDDDD]">
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Ferramenta</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Categoria</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Concessão</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Concedido por</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((acesso) => {
                const ferramenta = getFerramentaById(acesso.ferramentaId);
                if (!ferramenta) return null;
                const concedidoPorNome = acesso.concedidoPor
                  ? (getFuncionarioById(acesso.concedidoPor)?.nome ?? acesso.concedidoPor)
                  : "—";
                return (
                  <tr key={acesso.id} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{ferramenta.nome}</p>
                        <a href={ferramenta.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {ferramenta.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ferramenta.tipo === "Passbolt" ? "warning" : "secondary"} className="text-xs">
                        {ferramenta.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><StatusAcessoBadge status={acesso.status} /></td>
                    <td className="px-4 py-3 text-gray-500">
                      {acesso.dataConcessao
                        ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{concedidoPorNome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
