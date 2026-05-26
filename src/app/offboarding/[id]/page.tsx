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
    <div className="p-6 space-y-5 max-w-[800px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href={`/funcionarios/${func.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900 pl-0">
            <ArrowLeft className="h-4 w-4" /> {func.nome}
          </Button>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Offboarding</span>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">Offboarding — {func.nome}</h1>
                <StatusOffboardingBadge status={off.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <span>{func.cargo} · {func.area}</span>
                <span>Desligamento: <strong className="text-gray-700">{new Date(off.dataDesligamento + "T00:00:00").toLocaleDateString("pt-BR")}</strong></span>
                <span>Iniciado em: {new Date(off.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                {off.dataConclusao && (
                  <span>Concluído em: <strong className="text-gray-700">{new Date(off.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Progresso de remoção de acessos</span>
              <span className={`font-semibold ${concluido ? "text-[#16a34a]" : "text-[#D42126]"}`}>
                {removidos} de {totalItens} acessos removidos
              </span>
            </div>
            <Progress value={progresso} className={concluido ? "[&>div]:bg-[#16a34a]" : ""} />
            <p className="text-xs text-gray-400">{progresso}% concluído</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ferramentas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900">Acessos a remover</CardTitle>
            {off.status === "Em andamento" && !concluido && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                <AlertCircle className="h-3 w-3" />
                Marque todos os acessos para concluir
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#DDDDDD]">
            {itens.map((item) => {
              const ferramenta = getFerramentaById(item.ferramentaId);
              if (!ferramenta) return null;
              return (
                <div
                  key={item.id}
                  className={`px-6 py-4 transition-colors ${item.removido ? "bg-green-50/50" : "bg-white hover:bg-gray-50"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="mt-0.5">
                      {off.status === "Concluído" ? (
                        item.removido
                          ? <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
                          : <Circle className="h-5 w-5 text-gray-300" />
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
                          className={`font-medium cursor-pointer ${item.removido ? "line-through text-gray-400" : "text-gray-900"}`}
                        >
                          {ferramenta.nome}
                        </label>
                        <span className="text-xs text-gray-400">{ferramenta.categoria}</span>
                        <Badge
                          variant={item.tipoRemocao === "Trocar senha no Passbolt" ? "warning" : "secondary"}
                          className="text-xs"
                        >
                          {item.tipoRemocao}
                        </Badge>
                        {item.removido && item.dataRemocao && (
                          <span className="text-xs text-green-600">
                            Removido em {new Date(item.dataRemocao + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>

                      {/* Observação */}
                      {off.status === "Em andamento" && !item.removido && (
                        <Textarea
                          placeholder="Observação opcional..."
                          className="text-xs h-16 resize-none mt-1"
                          value={item.observacao ?? ""}
                          onChange={(e) => setObservacao(item.id, e.target.value)}
                        />
                      )}
                      {(off.status === "Concluído" || item.removido) && item.observacao && (
                        <p className="text-xs text-gray-400 italic">{item.observacao}</p>
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
            className={concluido ? "bg-[#16a34a] hover:bg-[#15803d]" : ""}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Concluir offboarding
          </Button>
          {!concluido && (
            <p className="text-xs text-gray-400 self-center">
              Marque todos os {totalItens} acessos antes de concluir.
            </p>
          )}
        </div>
      )}
      {off.status === "Concluído" && (
        <div className="flex items-center gap-2 text-[#16a34a] bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Offboarding concluído em {new Date((off.dataConclusao ?? "") + "T00:00:00").toLocaleDateString("pt-BR")}. Todos os acessos foram removidos.</p>
        </div>
      )}
    </div>
  );
}
