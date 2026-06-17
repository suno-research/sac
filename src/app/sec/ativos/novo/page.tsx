"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { CreateAtivoPayload, StatusEquipamento, TipoEquipamento } from "@/types/sec";
import { tipoLabel, statusLabel, TODOS_TIPOS, TODOS_STATUS } from "@/lib/sec-ativos";

type FormErrors = Partial<Record<keyof CreateAtivoPayload, string>>;

export default function NovoAtivoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isTI = session?.user?.role === "ti";

  const [salvando, setSalvando] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoEquipamento | "">("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [statusAtivo, setStatusAtivo] = useState<StatusEquipamento>("ativo");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [localizacaoAtual, setLocalizacaoAtual] = useState("");
  const [dataAquisicao, setDataAquisicao] = useState("");
  const [valorAquisicao, setValorAquisicao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [garantiaAte, setGarantiaAte] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) {
      router.replace("/sec/ativos");
    }
  }, [isTI, status, router]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!nome.trim()) next.nome = "Nome é obrigatório";
    if (!tipo) next.tipo = "Tipo é obrigatório";
    if (!marca.trim()) next.marca = "Marca é obrigatória";
    if (!modelo.trim()) next.modelo = "Modelo é obrigatório";
    if (!statusAtivo) next.status = "Status é obrigatório";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSalvando(true);
    try {
      const payload: CreateAtivoPayload = {
        nome: nome.trim(),
        tipo: tipo as TipoEquipamento,
        marca: marca.trim(),
        modelo: modelo.trim(),
        status: statusAtivo,
      };

      if (numeroSerie.trim()) payload.numero_serie = numeroSerie.trim();
      if (localizacaoAtual.trim()) payload.localizacao_atual = localizacaoAtual.trim();
      if (dataAquisicao) payload.data_aquisicao = dataAquisicao;
      if (valorAquisicao) payload.valor_aquisicao = valorAquisicao;
      if (fornecedor.trim()) payload.fornecedor = fornecedor.trim();
      if (notaFiscal.trim()) payload.nota_fiscal = notaFiscal.trim();
      if (garantiaAte) payload.garantia_ate = garantiaAte;
      if (observacoes.trim()) payload.observacoes = observacoes.trim();

      const res = await fetch("/api/sec/ativos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const criado = await res.json();
      toast("Ativo cadastrado com sucesso.");
      router.push(`/sec/ativos/${criado.equipamento_id}`);
    } catch {
      toast("Erro ao cadastrar ativo. Tente novamente.", "error");
    } finally {
      setSalvando(false);
    }
  }

  if (status === "loading" || !isTI) {
    return (
      <PageMotion>
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link href="/sec/ativos">
            <ArrowLeft className="h-4 w-4" /> Ativos
          </Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">Novo ativo</span>
      </div>

      <PageHeader
        title="Novo ativo"
        description="Cadastre um novo equipamento."
      />

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Identificação
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nome <span className="text-destructive">*</span>
                </label>
                <Input
                  className="mt-1.5"
                  placeholder='Ex: MacBook Pro 14" M3'
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                {errors.nome && (
                  <p className="mt-1 text-xs text-destructive">{errors.nome}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Tipo <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as TipoEquipamento)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TODOS_TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {tipoLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipo && (
                    <p className="mt-1 text-xs text-destructive">{errors.tipo}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={statusAtivo}
                    onValueChange={(v) => setStatusAtivo(v as StatusEquipamento)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TODOS_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Marca <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="mt-1.5"
                    placeholder="Ex: Apple, Dell, LG"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                  />
                  {errors.marca && (
                    <p className="mt-1 text-xs text-destructive">{errors.marca}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Modelo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="mt-1.5"
                    placeholder="Ex: MBP14-M3-16GB"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                  />
                  {errors.modelo && (
                    <p className="mt-1 text-xs text-destructive">{errors.modelo}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Localização e série
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Número de série
                </label>
                <Input
                  className="mt-1.5"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Localização atual
                </label>
                <Input
                  className="mt-1.5"
                  placeholder="Ex: Escritório SP — Mesa 12"
                  value={localizacaoAtual}
                  onChange={(e) => setLocalizacaoAtual(e.target.value)}
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Aquisição</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Data de aquisição
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={dataAquisicao}
                  onChange={(e) => setDataAquisicao(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Valor de aquisição
                </label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1.5"
                  value={valorAquisicao}
                  onChange={(e) => setValorAquisicao(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Fornecedor
                </label>
                <Input
                  className="mt-1.5"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nota fiscal
                </label>
                <Input
                  className="mt-1.5"
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Garantia até
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={garantiaAte}
                  onChange={(e) => setGarantiaAte(e.target.value)}
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Observações
            </h2>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o equipamento..."
            />
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/sec/ativos")}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={salvando}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-foreground dark:hover:bg-blue-500"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Salvar ativo"
            )}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
