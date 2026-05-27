"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { perfisPadrao, ferramentas, getFerramentaById } from "@/lib/mock-data";
import type { PerfilPadrao } from "@/lib/mock-data";

export default function PerfisPage() {
  const [perfis, setPerfis] = useState<PerfilPadrao[]>(perfisPadrao);
  const [editando, setEditando] = useState<PerfilPadrao | null>(null);
  const [ferramentasSelecionadas, setFerramentasSelecionadas] = useState<string[]>([]);

  const abrirEdicao = (perfil: PerfilPadrao) => {
    setEditando({ ...perfil });
    setFerramentasSelecionadas([...perfil.ferramentaIds]);
  };

  const salvarEdicao = () => {
    if (!editando) return;
    setPerfis((prev) =>
      prev.map((p) =>
        p.id === editando.id ? { ...editando, ferramentaIds: ferramentasSelecionadas } : p
      )
    );
    setEditando(null);
  };

  const toggleFerramenta = (id: string) => {
    setFerramentasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const ferramentasAgrupadas = ferramentas.reduce<Record<string, typeof ferramentas>>((acc, f) => {
    if (!acc[f.categoria]) acc[f.categoria] = [];
    acc[f.categoria].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-[1100px]">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Perfis Padrão</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Pacotes de acesso pré-definidos por cargo. Usados no onboarding para agilizar a concessão
          de ferramentas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {perfis.map((perfil) => {
          const ferrsDoPerfil = perfil.ferramentaIds.map(getFerramentaById).filter(Boolean);

          return (
            <div
              key={perfil.id}
              className="rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
            >
              <div className="bg-[#111827] rounded-t-2xl px-6 py-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-white text-lg font-semibold">{perfil.cargo}</h2>
                  <p className="text-[#9CA3AF] text-xs mt-1">{perfil.area}</p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirEdicao(perfil)}
                  className="flex items-center gap-1 text-[#9CA3AF] hover:text-white text-xs font-medium transition-colors shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>

              <div className="bg-white rounded-b-2xl border border-[#E5E7EB] border-t-0 px-6 py-5">
                <p className="text-sm text-[#6B7280] mb-4">{perfil.descricao}</p>

                <div className="flex flex-wrap gap-2">
                  {ferrsDoPerfil.map(
                    (f) =>
                      f && (
                        <span
                          key={f.id}
                          className={`text-xs px-3 py-1 rounded-full ${
                            f.tipo === "Passbolt"
                              ? "bg-[#FEF3C7] text-[#D97706]"
                              : "bg-[#F3F4F6] text-[#374151]"
                          }`}
                        >
                          {f.nome}
                        </span>
                      )
                  )}
                </div>

                <p className="text-xs text-[#9CA3AF] mt-4 pt-4 border-t border-[#F3F4F6]">
                  {perfil.ferramentaIds.length} ferramentas no pacote
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Editar perfil — {editando?.cargo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6B7280]">Cargo</Label>
              <Input
                className="rounded-xl border-[#E5E7EB] focus:ring-[#D42126]/20 focus:border-[#D42126]"
                value={editando?.cargo ?? ""}
                onChange={(e) => setEditando((p) => (p ? { ...p, cargo: e.target.value } : p))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6B7280]">Descrição</Label>
              <Input
                className="rounded-xl border-[#E5E7EB] focus:ring-[#D42126]/20 focus:border-[#D42126]"
                value={editando?.descricao ?? ""}
                onChange={(e) => setEditando((p) => (p ? { ...p, descricao: e.target.value } : p))}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-[#6B7280]">
                Ferramentas incluídas ({ferramentasSelecionadas.length} selecionadas)
              </Label>
              {Object.entries(ferramentasAgrupadas).map(([cat, ferrs]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                    {cat}
                  </p>
                  <div className="space-y-1.5 pl-1">
                    {ferrs.map((f) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-${f.id}`}
                          checked={ferramentasSelecionadas.includes(f.id)}
                          onCheckedChange={() => toggleFerramenta(f.id)}
                        />
                        <label
                          htmlFor={`edit-${f.id}`}
                          className="text-sm text-[#374151] cursor-pointer flex items-center gap-2"
                        >
                          {f.nome}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              f.tipo === "Passbolt"
                                ? "bg-[#FEF3C7] text-[#D97706]"
                                : "bg-[#F3F4F6] text-[#374151]"
                            }`}
                          >
                            {f.tipo}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarEdicao}
              className="bg-[#D42126] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#B91C1C]"
            >
              Salvar alterações
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
