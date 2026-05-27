"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusOffboardingBadge } from "@/components/layout/StatusBadge";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  area: string;
}

interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
}

interface AcessoFuncionario {
  id: string;
  funcionarioId: string;
  ferramentaId: string;
  status: string;
}

interface OffboardingRecord {
  id: string;
  funcionarioId?: string;
  dataDesligamento?: string;
  dataInicio: string;
  dataConclusao?: string;
  status: "Em andamento" | "Concluído";
  responsavelId?: string;
}

interface ItemOffboarding {
  id: string;
  ferramentaId: string;
  removido: boolean;
  tipoRemocao: "Remover usuário" | "Trocar senha no Passbolt";
  observacao?: string;
  dataRemocao?: string;
}

function buildItensFromAcessos(
  acessosPendentes: AcessoFuncionario[],
  ferramentas: Ferramenta[]
): ItemOffboarding[] {
  return acessosPendentes.map((a) => {
    const ferr = ferramentas.find((f) => f.id === a.ferramentaId);
    return {
      id: a.id,
      ferramentaId: a.ferramentaId,
      removido: false,
      tipoRemocao: ferr?.tipo === "Passbolt" ? "Trocar senha no Passbolt" : "Remover usuário",
      observacao: "",
    };
  });
}

export default function OffboardingPage() {
  const params = useParams();
  const offboardingId = params.id as string;

  const [offboarding, setOffboarding] = useState<OffboardingRecord | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<ItemOffboarding[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/offboardings").then((r) => r.json()),
      fetch("/api/funcionarios").then((r) => r.json()),
      fetch("/api/ferramentas").then((r) => r.json()),
      fetch("/api/acessos").then((r) => r.json()),
    ])
      .then(([offs, funcs, ferrs, acess]) => {
        const offList = Array.isArray(offs) ? offs : [];
        const funcList = Array.isArray(funcs) ? funcs : [];
        const ferrList = Array.isArray(ferrs) ? ferrs : [];
        const acessList = Array.isArray(acess) ? acess : [];

        const off = offList.find((o: OffboardingRecord) => o.id === offboardingId);

        if (!off) {
          const funcId = offboardingId === "off02" ? "u14" : offboardingId;
          const func = funcList.find((f: Funcionario) => f.id === funcId);
          const acessosPendentes = acessList.filter(
            (a: AcessoFuncionario) =>
              a.funcionarioId === funcId && a.status === "Pendente remoção"
          );
          setFuncionario(func || null);
          setItens(buildItensFromAcessos(acessosPendentes, ferrList));
          setOffboarding({
            id: offboardingId,
            funcionarioId: funcId,
            status: "Em andamento",
            dataInicio: new Date().toISOString().split("T")[0],
            dataDesligamento: new Date().toISOString().split("T")[0],
          });
        } else {
          const func = funcList.find((f: Funcionario) => f.id === off.funcionarioId);
          const acessosPendentes = acessList.filter(
            (a: AcessoFuncionario) =>
              a.funcionarioId === off.funcionarioId && a.status === "Pendente remoção"
          );
          setOffboarding(off);
          setFuncionario(func || null);
          setItens(buildItensFromAcessos(acessosPendentes, ferrList));
        }

        setFerramentas(ferrList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offboardingId]);

  const getFerramentaById = (id: string) => ferramentas.find((f) => f.id === id);

  const off = offboarding;
  const func = funcionario;

  const totalItens = itens.length;
  const removidos = itens.filter((i) => i.removido).length;
  const progresso = totalItens > 0 ? Math.round((removidos / totalItens) * 100) : 0;
  const concluido = totalItens > 0 && removidos === totalItens;

  const toggleItem = (itemId: string) => {
    if (off?.status === "Concluído") return;
    setItens((prev) => prev.map((i) => (i.id === itemId ? { ...i, removido: !i.removido } : i)));
  };

  const setObservacao = (itemId: string, obs: string) => {
    setItens((prev) => prev.map((i) => (i.id === itemId ? { ...i, observacao: obs } : i)));
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div style={{ height: 32, width: 200, background: "#F3F4F6", borderRadius: 8 }} />
        <div style={{ height: 160, background: "#F3F4F6", borderRadius: 16 }} />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 72, background: "#F3F4F6", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!off || !func) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/funcionarios">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <p className="text-muted-foreground">Offboarding não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href={`/funcionarios/${func.id}`}>
            <ArrowLeft className="h-4 w-4" /> {func.nome}
          </Link>
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">Offboarding</span>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Offboarding — {func.nome}
                </h1>
                <StatusOffboardingBadge status={off.status} />
              </div>
              <div className="flex items-center gap-4 text-[15px] text-muted-foreground flex-wrap leading-relaxed">
                <span>
                  {func.cargo} · {func.area}
                </span>
                {off.dataDesligamento && (
                  <span>
                    Desligamento:{" "}
                    <strong className="text-foreground">
                      {new Date(off.dataDesligamento + "T00:00:00").toLocaleDateString("pt-BR")}
                    </strong>
                  </span>
                )}
                <span>
                  Iniciado em:{" "}
                  {new Date(off.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
                {off.dataConclusao && (
                  <span>
                    Concluído em:{" "}
                    <strong className="text-foreground">
                      {new Date(off.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">Progresso de remoção de acessos</span>
              <span className={`font-semibold ${concluido ? "text-success" : "text-accent"}`}>
                {removidos} de {totalItens} acessos removidos
              </span>
            </div>
            <Progress value={progresso} className={concluido ? "[&>div]:bg-success" : "[&>div]:bg-accent"} />
            <p className="text-xs text-muted-foreground">{progresso}% concluído</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Acessos a remover</CardTitle>
            {off.status === "Em andamento" && !concluido && (
              <div className="flex items-center gap-1.5 text-xs text-warning bg-warning-muted border border-warning/20 rounded-full px-3.5 py-1.5">
                <AlertCircle className="h-3 w-3" />
                Marque todos os acessos para concluir
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {itens.length === 0 ? (
              <p className="px-8 py-10 text-sm text-muted-foreground text-center">
                Nenhum acesso pendente de remoção.
              </p>
            ) : (
              itens.map((item) => {
                const ferramenta = getFerramentaById(item.ferramentaId);
                if (!ferramenta) return null;
                return (
                  <div
                    key={item.id}
                    className={`px-8 py-6 transition-colors ${item.removido ? "bg-success-muted/50" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {off.status === "Concluído" ? (
                          item.removido ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/40" />
                          )
                        ) : (
                          <Checkbox
                            id={item.id}
                            checked={item.removido}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="h-5 w-5"
                          />
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={item.id}
                            className={`font-medium cursor-pointer text-[15px] ${item.removido ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            {ferramenta.nome}
                          </label>
                          <span className="text-xs text-muted-foreground">{ferramenta.categoria}</span>
                          <Badge
                            variant={
                              item.tipoRemocao === "Trocar senha no Passbolt" ? "warning" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.tipoRemocao}
                          </Badge>
                          {item.removido && item.dataRemocao && (
                            <span className="text-xs text-success">
                              Removido em{" "}
                              {new Date(item.dataRemocao + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>

                        {off.status === "Em andamento" && !item.removido && (
                          <Textarea
                            placeholder="Observação opcional..."
                            className="text-sm min-h-[72px] resize-none mt-2 rounded-xl"
                            value={item.observacao ?? ""}
                            onChange={(e) => setObservacao(item.id, e.target.value)}
                          />
                        )}
                        {(off.status === "Concluído" || item.removido) && item.observacao && (
                          <p className="text-sm text-muted-foreground italic">{item.observacao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {off.status === "Em andamento" && (
        <div className="flex justify-end gap-3 flex-wrap">
          <Button disabled={!concluido} className={concluido ? "bg-success hover:opacity-90" : ""}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Concluir offboarding
          </Button>
          {!concluido && totalItens > 0 && (
            <p className="text-sm text-muted-foreground self-center">
              Marque todos os {totalItens} acessos antes de concluir.
            </p>
          )}
        </div>
      )}
      {off.status === "Concluído" && (
        <div className="flex items-center gap-3 text-success bg-success-muted border border-success/20 rounded-xl px-6 py-4">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Offboarding concluído em{" "}
            {new Date((off.dataConclusao ?? "") + "T00:00:00").toLocaleDateString("pt-BR")}. Todos os
            acessos foram removidos.
          </p>
        </div>
      )}
    </div>
  );
}
