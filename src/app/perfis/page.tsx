"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
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
import { Checkbox } from "@/components/ui/checkbox";
import { perfisPadrao, ferramentas, getFerramentaById } from "@/lib/mock-data";
import type { PerfilPadrao } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMotion } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <PageMotion>
      <PageHeader
        title="Perfis Padrão"
        description="Pacotes de acesso pré-definidos por cargo. Usados no onboarding para agilizar a concessão de ferramentas."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {perfis.map((perfil, index) => {
          const ferrsDoPerfil = perfil.ferramentaIds.map(getFerramentaById).filter(Boolean);

          return (
            <motion.article
              key={perfil.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col hover:shadow-elevated transition-shadow duration-200"
            >
              <div className="px-8 py-7 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">{perfil.cargo}</h2>
                  <Badge variant="secondary" className="mt-3">
                    {perfil.area}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => abrirEdicao(perfil)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </div>

              <div className="px-8 py-8 flex-1 flex flex-col">
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">{perfil.descricao}</p>

                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Ferramentas incluídas
                </p>

                <div className="flex flex-wrap gap-2.5 flex-1">
                  {ferrsDoPerfil.map(
                    (f) =>
                      f && (
                        <Badge
                          key={f.id}
                          variant={f.tipo === "Passbolt" ? "warning" : "secondary"}
                          className="text-xs px-3.5 py-1.5"
                        >
                          {f.nome}
                        </Badge>
                      )
                  )}
                </div>

                <p className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground font-medium">
                  {perfil.ferramentaIds.length} ferramentas no pacote
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Editar perfil — {editando?.cargo}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={editando?.cargo ?? ""}
                onChange={(e) => setEditando((p) => (p ? { ...p, cargo: e.target.value } : p))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={editando?.descricao ?? ""}
                onChange={(e) => setEditando((p) => (p ? { ...p, descricao: e.target.value } : p))}
              />
            </div>
            <div className="space-y-4">
              <Label>Ferramentas incluídas ({ferramentasSelecionadas.length} selecionadas)</Label>
              {Object.entries(ferramentasAgrupadas).map(([cat, ferrs]) => (
                <div key={cat} className="rounded-xl border border-border p-5 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {cat}
                  </p>
                  <div className="space-y-3">
                    {ferrs.map((f) => (
                      <div key={f.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`edit-${f.id}`}
                          checked={ferramentasSelecionadas.includes(f.id)}
                          onCheckedChange={() => toggleFerramenta(f.id)}
                        />
                        <label
                          htmlFor={`edit-${f.id}`}
                          className="text-[15px] text-foreground cursor-pointer flex items-center gap-2.5 flex-1"
                        >
                          {f.nome}
                          <Badge variant={f.tipo === "Passbolt" ? "warning" : "secondary"} className="text-[10px]">
                            {f.tipo}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
