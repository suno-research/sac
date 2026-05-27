"use client";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ferramentas, getTotalUsuariosAtivos } from "@/lib/mock-data";
import type { CategoriaFerramenta, TipoAcesso } from "@/lib/mock-data";

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

const selectClass =
  "border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#D42126]/20 focus:border-[#D42126] cursor-pointer";

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Ferramentas</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {ferramentas.length} ferramentas cadastradas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 bg-[#D42126] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#B91C1C] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova ferramenta
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Buscar ferramenta..."
            className="w-full border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D42126]/20 focus:border-[#D42126]"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={selectClass}
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {emojiCategoria[c]} {c}
            </option>
          ))}
        </select>

        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass}>
          <option value="todos">Todos os tipos</option>
          <option value="Individual">Individual</option>
          <option value="Passbolt">Passbolt</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setCategoria("todas");
              setTipo("todos");
            }}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Nome
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Tipo de acesso
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                URL
              </th>
              <th className="px-8 py-4 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Usuários ativos
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#9CA3AF]">
                  Nenhuma ferramenta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const ativos = getTotalUsuariosAtivos(f.id);
                return (
                  <tr key={f.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center">
                        <span className="mr-3 text-base" aria-hidden>
                          {emojiCategoria[f.categoria]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#212121]">{f.nome}</p>
                          <p className="text-xs text-[#9CA3AF]">{f.descricao}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
                        {f.categoria}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          f.tipo === "Passbolt"
                            ? "bg-[#FEF3C7] text-[#D97706]"
                            : "bg-[#EFF6FF] text-[#3B82F6]"
                        }`}
                      >
                        {f.tipo}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6B7280] hover:text-[#D42126] transition-colors"
                      >
                        {f.url.replace("https://", "")}
                      </a>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-medium text-[#111827]">{ativos}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
            Exibindo {filtered.length} de {ferramentas.length} ferramentas
          </div>
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Nova ferramenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6B7280]">Nome da ferramenta</Label>
              <Input
                className="rounded-xl border-[#E5E7EB]"
                placeholder="Ex: Jira"
                value={novaFerramenta.nome}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6B7280]">Categoria</Label>
                <Select
                  value={novaFerramenta.categoria}
                  onValueChange={(v) =>
                    setNovaFerramenta((p) => ({ ...p, categoria: v as CategoriaFerramenta }))
                  }
                >
                  <SelectTrigger className="rounded-xl border-[#E5E7EB]">
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
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6B7280]">Tipo de acesso</Label>
                <Select
                  value={novaFerramenta.tipo}
                  onValueChange={(v) =>
                    setNovaFerramenta((p) => ({ ...p, tipo: v as TipoAcesso }))
                  }
                >
                  <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Passbolt">Passbolt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6B7280]">URL</Label>
              <Input
                className="rounded-xl border-[#E5E7EB]"
                placeholder="https://..."
                value={novaFerramenta.url}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6B7280]">Descrição</Label>
              <Input
                className="rounded-xl border-[#E5E7EB]"
                placeholder="Descreva brevemente a ferramenta"
                value={novaFerramenta.descricao}
                onChange={(e) => setNovaFerramenta((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
            >
              Cancelar
            </button>
            <button
              type="button"
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
              className="bg-[#D42126] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cadastrar ferramenta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
