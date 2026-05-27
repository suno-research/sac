import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, Building2, User, ExternalLink, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusFuncionarioBadge, StatusAcessoBadge } from "@/components/layout/StatusBadge";
import { Avatar } from "@/components/ui/avatar";
import { thFirst, thMid, thLast, tdFirst, tdMid, tdLast, trHover } from "@/lib/table-classes";
import {
  getFuncionarioById,
  getAcessosByFuncionario,
  getFerramentaById,
  getFuncionarioById as getNome,
  offboardings,
} from "@/lib/mock-data";

export default function FuncionarioDetailPage({ params }: { params: { id: string } }) {
  const func = getFuncionarioById(params.id);
  if (!func) notFound();

  const acessos = getAcessosByFuncionario(func.id);
  const gestorNome = func.gestorId ? getNome(func.gestorId)?.nome : null;
  const offboarding = offboardings.find((o) => o.funcionarioId === func.id);

  const grupos: Record<string, typeof acessos> = {
    Ativo: [],
    "Pendente concessão": [],
    "Pendente remoção": [],
    "Sem acesso": [],
  };
  acessos.forEach((a) => grupos[a.status]?.push(a));

  const statsSummary = [
    { label: "Ativos", count: grupos["Ativo"].length, className: "text-success bg-success-muted" },
    { label: "Pend. concessão", count: grupos["Pendente concessão"].length, className: "text-warning bg-warning-muted" },
    { label: "Pend. remoção", count: grupos["Pendente remoção"].length, className: "text-destructive bg-destructive-muted" },
    { label: "Sem acesso", count: grupos["Sem acesso"].length, className: "text-muted-foreground bg-muted" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/funcionarios">
            <ArrowLeft className="h-4 w-4" /> Funcionários
          </Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">{func.nome}</span>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <Avatar name={func.nome} size="lg" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">{func.nome}</h1>
                <p className="text-[15px] text-muted-foreground mt-1">{func.cargo}</p>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <StatusFuncionarioBadge status={func.status} />
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {func.area}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {func.email}
                  </span>
                  {gestorNome && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-4 w-4" /> {gestorNome}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Desde{" "}
                    {new Date(func.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {func.status === "Ativo" && !offboarding && (
                <Button variant="destructive" size="default" className="gap-2">
                  <ClipboardList className="h-4 w-4" /> Iniciar Offboarding
                </Button>
              )}
              {offboarding && offboarding.status === "Em andamento" && (
                <Button variant="outline" size="default" asChild className="gap-2 border-warning/40 text-warning hover:bg-warning-muted">
                  <Link href={`/offboarding/${offboarding.id}`}>
                    <ClipboardList className="h-4 w-4" /> Ver checklist de offboarding
                  </Link>
                </Button>
              )}
              {offboarding && offboarding.status === "Concluído" && (
                <Button variant="outline" size="default" asChild className="gap-2">
                  <Link href={`/offboarding/${offboarding.id}`}>
                    <ClipboardList className="h-4 w-4" /> Ver offboarding concluído
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border">
            {statsSummary.map((s) => (
              <div key={s.label} className={`rounded-xl p-5 ${s.className}`}>
                <p className="text-3xl font-semibold tabular-nums">{s.count}</p>
                <p className="text-sm mt-1.5 opacity-90">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ferramentas e acessos ({acessos.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className={thFirst}>Ferramenta</th>
                  <th className={thMid}>Categoria</th>
                  <th className={thMid}>Tipo</th>
                  <th className={thMid}>Status</th>
                  <th className={thMid}>Concessão</th>
                  <th className={thLast}>Concedido por</th>
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
                    <tr key={acesso.id} className={trHover}>
                      <td className={tdFirst}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{ferramenta.nome}</p>
                          <a
                            href={ferramenta.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-accent transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                      <td className={tdMid}>
                        <Badge variant="secondary">{ferramenta.categoria}</Badge>
                      </td>
                      <td className={tdMid}>
                        <Badge variant={ferramenta.tipo === "Passbolt" ? "warning" : "secondary"}>
                          {ferramenta.tipo}
                        </Badge>
                      </td>
                      <td className={tdMid}>
                        <StatusAcessoBadge status={acesso.status} />
                      </td>
                      <td className={tdMid}>
                        {acesso.dataConcessao
                          ? new Date(acesso.dataConcessao + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className={tdLast}>{concedidoPorNome}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
