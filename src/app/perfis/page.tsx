"use client";
import { useState } from "react";
import { Pencil, Package, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { perfisPadrao, ferramentas, getFerramentaById } from "@/lib/mock-data";
import type { PerfilPadrao } from "@/lib/mock-data";

const categoriaCores: Record<string, string> = {
  "Comunicação": "bg-blue-100 text-blue-700",
  "Analytics": "bg-purple-100 text-purple-700",
  "Desenvolvimento": "bg-gray-100 text-gray-700",
  "Financeiro": "bg-green-100 text-green-700",
  "Marketing": "bg-pink-100 text-pink-700",
  "Produtividade": "bg-orange-100 text-orange-700",
  "Segurança": "bg-red-100 text-red-700",
  "Infraestrutura": "bg-indigo-100 text-indigo-700",
};

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
    setPerfis((prev) => prev.map((p) => p.id === editando.id ? { ...editando, ferramentaIds: ferramentasSelecionadas } : p));
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
    <div className="p-6 space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Perfis Padrão</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pacotes de acesso pré-definidos por cargo. Usados no onboarding para agilizar a concessão de ferramentas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {perfis.map((perfil) => {
          const ferrsDoPeril = perfil.ferramentaIds.map(getFerramentaById).filter(Boolean);
          const porCategoria = ferrsDoPeril.reduce<Record<string, typeof ferrsDoPeril>>((acc, f) => {
            if (!f) return acc;
            if (!acc[f.categoria]) acc[f.categoria] = [];
            acc[f.categoria].push(f);
            return acc;
          }, {});

          return (
            <Card key={perfil.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D42126]/10">
                      <Package className="h-5 w-5 text-[#D42126]" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">{perfil.cargo}</CardTitle>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Building2 className="h-3 w-3" /> {perfil.area}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => abrirEdicao(perfil)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar perfil
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{perfil.descricao}</p>

                <div className="space-y-3">
                  {Object.entries(porCategoria).map(([cat, ferrs]) => (
                    <div key={cat}>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {ferrs.map((f) => f && (
                          <div key={f.id} className="flex items-center gap-1.5 rounded-lg border border-[#DDDDDD] bg-white px-3 py-1.5">
                            <span className="text-sm text-gray-700 font-medium">{f.nome}</span>
                            <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {f.tipo}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#DDDDDD] flex items-center gap-2">
                  <span className="text-xs text-gray-400">Total de ferramentas:</span>
                  <Badge variant="secondary">{perfil.ferramentaIds.length} ferramentas</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de edição */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil — {editando?.cargo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input
                value={editando?.cargo ?? ""}
                onChange={(e) => setEditando((p) => p ? { ...p, cargo: e.target.value } : p)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={editando?.descricao ?? ""}
                onChange={(e) => setEditando((p) => p ? { ...p, descricao: e.target.value } : p)}
              />
            </div>
            <div className="space-y-3">
              <Label>Ferramentas incluídas ({ferramentasSelecionadas.length} selecionadas)</Label>
              {Object.entries(ferramentasAgrupadas).map(([cat, ferrs]) => (
                <div key={cat}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-2 inline-flex items-center rounded-full px-2 py-0.5 ${categoriaCores[cat] ?? "bg-gray-100 text-gray-600"}`}>
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
                        <label htmlFor={`edit-${f.id}`} className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                          {f.nome}
                          <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {f.tipo}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
