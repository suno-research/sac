"use client";
import { useState } from "react";
import { Search, Plus, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ferramentas, getTotalUsuariosAtivos } from "@/lib/mock-data";
import type { CategoriaFerramenta, TipoAcesso } from "@/lib/mock-data";

const categorias: CategoriaFerramenta[] = [
  "Comunicação", "Analytics", "Desenvolvimento", "Financeiro",
  "Marketing", "Produtividade", "Segurança", "Infraestrutura",
];

const categoriaCores: Record<CategoriaFerramenta, string> = {
  "Comunicação": "bg-blue-100 text-blue-700",
  "Analytics": "bg-purple-100 text-purple-700",
  "Desenvolvimento": "bg-gray-100 text-gray-700",
  "Financeiro": "bg-green-100 text-green-700",
  "Marketing": "bg-pink-100 text-pink-700",
  "Produtividade": "bg-orange-100 text-orange-700",
  "Segurança": "bg-red-100 text-red-700",
  "Infraestrutura": "bg-indigo-100 text-indigo-700",
};

export default function FerramentasPage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [tipo, setTipo] = useState<string>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [novaFerramenta, setNovaFerramenta] = useState({ nome: "", categoria: "" as CategoriaFerramenta | "", tipo: "" as TipoAcesso | "", url: "", descricao: "" });

  const filtered = ferramentas.filter((f) => {
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || f.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoria === "todas" || f.categoria === categoria;
    const matchTipo = tipo === "todos" || f.tipo === tipo;
    return matchBusca && matchCategoria && matchTipo;
  });

  return (
    <div className="p-6 space-y-5 max-w-[1280px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ferramentas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ferramentas.length} ferramentas cadastradas</p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova ferramenta
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ferramenta..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Passbolt">Passbolt</SelectItem>
              </SelectContent>
            </Select>
            {(busca || categoria !== "todas" || tipo !== "todos") && (
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600"
                onClick={() => { setBusca(""); setCategoria("todas"); setTipo("todos"); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDDD]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Tipo de acesso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">URL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Usuários ativos</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">Nenhuma ferramenta encontrada.</td></tr>
                ) : (
                  filtered.map((f) => {
                    const ativos = getTotalUsuariosAtivos(f.id);
                    return (
                      <tr key={f.id} className="border-b border-[#DDDDDD]/50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{f.nome}</p>
                          <p className="text-xs text-gray-400">{f.descricao}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoriaCores[f.categoria]}`}>
                            {f.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"}>
                            {f.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#D42126] hover:underline"
                          >
                            {f.url.replace("https://", "")} <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {ativos}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-[#DDDDDD] text-xs text-gray-400">
              Exibindo {filtered.length} de {ferramentas.length} ferramentas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Ferramenta */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova ferramenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da ferramenta</Label>
              <Input placeholder="Ex: Jira" value={novaFerramenta.nome}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={novaFerramenta.categoria}
                  onValueChange={(v) => setNovaFerramenta((p) => ({ ...p, categoria: v as CategoriaFerramenta }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de acesso</Label>
                <Select value={novaFerramenta.tipo}
                  onValueChange={(v) => setNovaFerramenta((p) => ({ ...p, tipo: v as TipoAcesso }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Passbolt">Passbolt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input placeholder="https://..." value={novaFerramenta.url}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Descreva brevemente a ferramenta" value={novaFerramenta.descricao}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              disabled={!novaFerramenta.nome || !novaFerramenta.categoria || !novaFerramenta.tipo || !novaFerramenta.url}
              onClick={() => { alert("Ferramenta cadastrada! (integração com backend pendente)"); setModalAberto(false); }}
            >
              Cadastrar ferramenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
