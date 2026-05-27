"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, Building2, User, ExternalLink, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusFuncionarioBadge, StatusAcessoBadge } from "@/components/layout/StatusBadge";

type StatusAcesso = "Ativo" | "Pendente concessão" | "Pendente remoção" | "Sem acesso";
import { Avatar } from "@/components/ui/avatar";
import { thFirst, thMid, thLast, tdFirst, tdMid, tdLast, trHover } from "@/lib/table-classes";

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  area: string;
  gestorId: string | null;
  status: "Ativo" | "Desligado";
  dataEntrada: string;
  dataDesligamento?: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
  url: string;
  descricao: string;
}

interface AcessoFuncionario {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: StatusAcesso;
  dataConcessao?: string;
  concedidoPor?: string;
}

interface Offboarding {
  id: string;
  funcionarioId: string;
  status: string;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div style={{ height: 120, background: "#F3F4F6", borderRadius: 16 }} />
      <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} style={{ height: 56, background: "#F3F4F6", borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

export default function FuncionarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [iniciandoOffboarding, setIniciandoOffboarding] = useState(false);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [acessos, setAcessos] = useState<AcessoFuncionario[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/acessos").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/offboardings").then((r) => r.json()),
    ])
      .then(([funcs, acess, ferrs, offs]) => {
        const funcList = Array.isArray(funcs) ? funcs : [];
        const func = funcList.find((f: Funcionario) => f.id === id) || null;
        setFuncionario(func);
        setFuncionarios(funcList);
        setAcessos(
          (Array.isArray(acess) ? acess : []).filter(
            (a: AcessoFuncionario) => a.funcionarioId === id
          )
        );
        setFerramentas(Array.isArray(ferrs) ? ferrs : []);
        setOffboardings(Array.isArray(offs) ? offs : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getFerramentaById = (ferramentaId: string) => ferramentas.find((f) => f.id === ferramentaId);
  const getNomeFuncionario = (funcionarioId: string) =>
    funcionarios.find((f) => f.id === funcionarioId)?.nome ?? "—";

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!funcionario) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/funcionarios">
            <ArrowLeft className="h-4 w-4" /> Funcionários
          </Link>
        </Button>
        <p className="text-muted-foreground">Funcionário não encontrado.</p>
      </div>
    );
  }

  const gestorNome = funcionario.gestorId ? getNomeFuncionario(funcionario.gestorId) : null;
  const offboarding = offboardings.find((o) => o.funcionarioId === funcionario.id);

  const grupos: Record<string, AcessoFuncionario[]> = {
    Ativo: [],
    "Pendente concessão": [],
    "Pendente remoção": [],
    "Sem acesso": [],
  };
  acessos.forEach((a) => grupos[a.status]?.push(a));

  async function iniciarOffboarding() {
    if (!funcionario) return;
    setIniciandoOffboarding(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const offId = `off${Date.now()}`;

      await fetch("/api/offboardings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offId,
          funcionarioId: funcionario.id,
          dataDesligamento: hoje,
          dataInicio: hoje,
          dataConclusao: "",
          status: "Em andamento",
          responsavelId: "",
        }),
      });

      await fetch("/api/acessos/update-batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionarioId: funcionario.id, novoStatus: "Pendente remoção" }),
      });

      await fetch(`/api/funcionarios/${funcionario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Desligado", dataDesligamento: hoje }),
      });

      router.push(`/offboarding/${offId}`);
    } catch (e) {
      console.error("Erro ao iniciar offboarding", e);
    } finally {
      setIniciandoOffboarding(false);
    }
  }

  const statsSummary = [
    { label: "Ativos", count: grupos["Ativo"].length, className: "text-success bg-success-muted" },
    {
      label: "Pend. concessão",
      count: grupos["Pendente concessão"].length,
      className: "text-warning bg-warning-muted",
    },
    {
      label: "Pend. remoção",
      count: grupos["Pendente remoção"].length,
      className: "text-destructive bg-destructive-muted",
    },
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
        <span className="text-sm text-muted-foreground">{funcionario.nome}</span>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <Avatar name={funcionario.nome} size="lg" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">{funcionario.nome}</h1>
                <p className="text-[15px] text-muted-foreground mt-1">{funcionario.cargo}</p>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <StatusFuncionarioBadge status={funcionario.status} />
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {funcionario.area}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {funcionario.email}
                  </span>
                  {gestorNome && gestorNome !== "—" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-4 w-4" /> {gestorNome}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Desde{" "}
                    {new Date(funcionario.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {funcionario.status === "Ativo" && !offboarding && (
                <Button
                  variant="destructive"
                  size="default"
                  className="gap-2"
                  onClick={iniciarOffboarding}
                  disabled={iniciandoOffboarding}
                >
                  {iniciandoOffboarding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  Iniciar Offboarding
                </Button>
              )}
              {offboarding && offboarding.status === "Em andamento" && (
                <Button
                  variant="outline"
                  size="default"
                  asChild
                  className="gap-2 border-warning/40 text-warning hover:bg-warning-muted"
                >
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
                    ? getNomeFuncionario(acesso.concedidoPor) !== "—"
                      ? getNomeFuncionario(acesso.concedidoPor)
                      : acesso.concedidoPor
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
