"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ferramentas, getTotalUsuariosAtivos } from "@/lib/mock-data";
import type { CategoriaFerramenta, TipoAcesso } from "@/lib/mock-data";
import {
  thFirst,
  thMid,
  thLast,
  tdName,
  tdMid,
  tdLast,
  trHover,
} from "@/lib/table-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categorias: CategoriaFerramenta[] = [
  "Comunicação",
  "Analytics",
  "Desenvolvimento",
  "Financeiro",
  "Marketing",
  "Produtividade",
  "Segurança",
  "Infraestrutura",
];

const emojiCategoria: Record<CategoriaFerramenta, string> = {
  Produtividade: "📋",
  Analytics: "📊",
  Desenvolvimento: "💻",
  Financeiro: "💰",
  Marketing: "📣",
  Comunicação: "💬",
  Segurança: "🔐",
  Infraestrutura: "⚙️",
};

export default function FerramentasPage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [tipo, setTipo] = useState<string>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [novaFerramenta, setNovaFerramenta] = useState({
    nome: "",
    categoria: "" as CategoriaFerramenta | "",
    tipo: "" as TipoAcesso | "",
    url: "",
    descricao: "",
  });

  const filtered = ferramentas.filter((f) => {
    const matchBusca =
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoria === "todas" || f.categoria === categoria;
    const matchTipo = tipo === "todos" || f.tipo === tipo;
    return matchBusca && matchCategoria && matchTipo;
  });

  const hasFilters = busca || categoria !== "todas" || tipo !== "todos";

  return (
    <PageMotion>
      <PageHeader
        title="Ferramentas"
        description={`${ferramentas.length} ferramentas cadastradas`}
        action={
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="h-4 w-4" />
            Nova ferramenta
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Buscar ferramenta..."
        searchValue={busca}
        onSearchChange={setBusca}
        showClear={hasFilters}
        onClear={() => {
          setBusca("");
          setCategoria("todas");
          setTipo("todos");
        }}
      >
        <FilterSelect value={categoria} onChange={setCategoria}>
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {emojiCategoria[c]} {c}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={tipo} onChange={setTipo}>
          <option value="todos">Todos os tipos</option>
          <option value="Individual">Individual</option>
          <option value="Passbolt">Passbolt</option>
        </FilterSelect>
      </FilterBar>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className={thFirst}>Nome</th>
              <th className={thMid}>Categoria</th>
              <th className={thMid}>Tipo de acesso</th>
              <th className={thMid}>URL</th>
              <th className={`${thLast} text-right`}>Usuários ativos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="pl-10 pr-10 py-14 text-center text-[15px] text-muted-foreground">
                  Nenhuma ferramenta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const ativos = getTotalUsuariosAtivos(f.id);
                return (
                  <tr key={f.id} className={trHover}>
                    <td className={tdName}>
                      <div className="flex items-center gap-4">
                        <span className="text-xl flex-shrink-0" aria-hidden>
                          {emojiCategoria[f.categoria]}
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.descricao}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdMid}>
                      <Badge variant="secondary">{f.categoria}</Badge>
                    </td>
                    <td className={tdMid}>
                      <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"}>{f.tipo}</Badge>
                    </td>
                    <td className="px-8 py-6 text-[15px] min-w-[240px]">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        {f.url.replace("https://", "")}
                      </a>
                    </td>
                    <td className={`${tdLast} text-right font-medium text-foreground tabular-nums`}>
                      {ativos}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-10 py-5 border-t border-border text-sm text-muted-foreground">
            Exibindo {filtered.length} de {ferramentas.length} ferramentas
          </div>
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nova ferramenta</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da ferramenta</Label>
              <Input
                placeholder="Ex: Jira"
                value={novaFerramenta.nome}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={novaFerramenta.categoria}
                  onValueChange={(v) =>
                    setNovaFerramenta((p) => ({ ...p, categoria: v as CategoriaFerramenta }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {emojiCategoria[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de acesso</Label>
                <Select
                  value={novaFerramenta.tipo}
                  onValueChange={(v) => setNovaFerramenta((p) => ({ ...p, tipo: v as TipoAcesso }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Passbolt">Passbolt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={novaFerramenta.url}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Descreva brevemente a ferramenta"
                value={novaFerramenta.descricao}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !novaFerramenta.nome ||
                !novaFerramenta.categoria ||
                !novaFerramenta.tipo ||
                !novaFerramenta.url
              }
              onClick={() => {
                alert("Ferramenta cadastrada! (integração com backend pendente)");
                setModalAberto(false);
              }}
            >
              Cadastrar ferramenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
