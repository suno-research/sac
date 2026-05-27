"use client";
import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusOffboardingBadge } from "@/components/layout/StatusBadge";
import { offboardings, getFuncionarioById, getFerramentaById } from "@/lib/mock-data";

export default function OffboardingPage({ params }: { params: { id: string } }) {
  const off = offboardings.find((o) => o.id === params.id);
  if (!off) notFound();

  const func = getFuncionarioById(off.funcionarioId);
  if (!func) notFound();

  const [itens, setItens] = useState(off.itens.map((item) => ({ ...item })));

  const totalItens = itens.length;
  const removidos = itens.filter((i) => i.removido).length;
  const progresso = totalItens > 0 ? Math.round((removidos / totalItens) * 100) : 0;
  const concluido = removidos === totalItens;

  const toggleItem = (id: string) => {
    if (off.status === "Concluído") return;
    setItens((prev) => prev.map((i) => i.id === id ? { ...i, removido: !i.removido } : i));
  };

  const setObservacao = (id: string, obs: string) => {
    setItens((prev) => prev.map((i) => i.id === id ? { ...i, observacao: obs } : i));
  };

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

      {/* Header */}
      <Card>
        <CardContent className="pt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Offboarding — {func.nome}</h1>
                <StatusOffboardingBadge status={off.status} />
              </div>
              <div className="flex items-center gap-4 text-[15px] text-muted-foreground flex-wrap leading-relaxed">
                <span>{func.cargo} · {func.area}</span>
                <span>Desligamento: <strong className="text-foreground">{new Date(off.dataDesligamento + "T00:00:00").toLocaleDateString("pt-BR")}</strong></span>
                <span>Iniciado em: {new Date(off.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                {off.dataConclusao && (
                  <span>Concluído em: <strong className="text-foreground">{new Date(off.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")}</strong></span>
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

      {/* Lista de ferramentas */}
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
            {itens.map((item) => {
              const ferramenta = getFerramentaById(item.ferramentaId);
              if (!ferramenta) return null;
              return (
                <div
                  key={item.id}
                  className={`px-8 py-6 transition-colors ${item.removido ? "bg-success-muted/50" : "hover:bg-muted/40"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="mt-0.5">
                      {off.status === "Concluído" ? (
                        item.removido
                          ? <CheckCircle2 className="h-5 w-5 text-success" />
                          : <Circle className="h-5 w-5 text-muted-foreground/40" />
                      ) : (
                        <Checkbox
                          id={item.id}
                          checked={item.removido}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="h-5 w-5"
                        />
                      )}
                    </div>

                    {/* Conteúdo */}
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
                          variant={item.tipoRemocao === "Trocar senha no Passbolt" ? "warning" : "secondary"}
                          className="text-xs"
                        >
                          {item.tipoRemocao}
                        </Badge>
                        {item.removido && item.dataRemocao && (
                          <span className="text-xs text-success">
                            Removido em {new Date(item.dataRemocao + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>

                      {/* Observação */}
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
            })}
          </div>
        </CardContent>
      </Card>

      {/* Botão de conclusão */}
      {off.status === "Em andamento" && (
        <div className="flex justify-end gap-3">
          <Button
            disabled={!concluido}
            className={concluido ? "bg-success hover:opacity-90" : ""}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Concluir offboarding
          </Button>
          {!concluido && (
            <p className="text-sm text-muted-foreground self-center">
              Marque todos os {totalItens} acessos antes de concluir.
            </p>
          )}
        </div>
      )}
      {off.status === "Concluído" && (
        <div className="flex items-center gap-3 text-success bg-success-muted border border-success/20 rounded-xl px-6 py-4">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Offboarding concluído em {new Date((off.dataConclusao ?? "") + "T00:00:00").toLocaleDateString("pt-BR")}. Todos os acessos foram removidos.</p>
        </div>
      )}
    </div>
  );
}
