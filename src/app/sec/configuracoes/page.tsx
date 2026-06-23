"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ExternalLink,
  Sheet,
  Webhook,
  Sparkles,
  Info,
} from "lucide-react";
import { PageMotion } from "@/components/ui/page-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SecConfig = {
  sheetIdSuffix: string;
  sheetUrl: string;
  webhookConfigured: boolean;
};

const ABAS_PLANILHA = [
  "EQUIPAMENTOS",
  "PATRIMONIO",
  "ESTOQUE",
  "ALOCACOES",
  "TERMOS",
  "_AUDITORIA",
  "_CONFIG",
  "_ENUMS",
];

const INTEGRACOES_FUTURAS = [
  "ClickSign — assinatura digital de termos",
  "Numeração automática de patrimônio",
  "Alertas de garantia por e-mail",
  "Importação em lote de equipamentos",
  "QR Code por ativo",
];

function ConfigCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isTI = session?.user?.role === "ti";

  const [config, setConfig] = useState<SecConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!isTI) router.replace("/sec/dashboard");
  }, [isTI, status, router]);

  useEffect(() => {
    if (!isTI) return;
    fetch("/api/sec/config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isTI]);

  if (status === "loading" || !isTI) {
    return (
      <PageMotion>
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </PageMotion>
    );
  }

  const buildYear = new Date().getFullYear();

  return (
    <PageMotion>
      <PageHeader
        title="Configurações"
        description="Informações técnicas e referências do módulo SEC."
      />

      <div className="space-y-8 max-w-3xl">
        <ConfigCard title="Planilha SEC" icon={<Sheet className="h-5 w-5" />}>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-muted/60 animate-pulse" />
              <div className="h-10 rounded-lg bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <>
              <ConfigRow
                label="ID da planilha"
                value={
                  config?.sheetIdSuffix ? (
                    <span className="font-mono">••••••{config.sheetIdSuffix}</span>
                  ) : (
                    <span className="text-muted-foreground">ID não configurado</span>
                  )
                }
              />
              <ConfigRow
                label="Abas configuradas"
                value={
                  <p className="text-muted-foreground leading-relaxed">
                    {ABAS_PLANILHA.join(" · ")}
                  </p>
                }
              />
              {config?.sheetUrl ? (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a
                    href={config.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir planilha <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  ID não configurado — defina GOOGLE_SHEETS_SEC_ID.
                </p>
              )}
            </>
          )}
        </ConfigCard>

        <ConfigCard title="Webhook n8n" icon={<Webhook className="h-5 w-5" />}>
          <ConfigRow
            label="Endpoint"
            value={<code className="text-xs font-mono">POST /api/sec/webhook/n8n</code>}
          />
          <ConfigRow
            label="Autenticação"
            value={
              <code className="text-xs font-mono">Bearer {"{N8N_WEBHOOK_SECRET}"}</code>
            }
          />
          <ConfigRow
            label="Eventos suportados"
            value={
              <span className="text-muted-foreground">
                offboarding_iniciado · offboarding_concluido
              </span>
            }
          />
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge
              variant={config?.webhookConfigured ? "success" : "destructive"}
            >
              {config?.webhookConfigured ? "Configurado" : "Não configurado"}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/suno-research/sac/blob/main/docs/n8n-webhook.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver documentação completa <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </ConfigCard>

        <ConfigCard
          title="Integrações futuras"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <ul className="space-y-3">
            {INTEGRACOES_FUTURAS.map((item) => (
              <li
                key={item}
                className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
              >
                <span>{item}</span>
                <Badge variant="muted" className="shrink-0 text-[11px]">
                  Em breve
                </Badge>
              </li>
            ))}
          </ul>
        </ConfigCard>

        <div className="rounded-xl border border-border bg-muted/30 p-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">SEC v1.0 — MVP</p>
            <p className="text-muted-foreground mt-1">Sprints 0–5 concluídas</p>
            <p className="text-xs text-muted-foreground mt-2">
              Build {buildYear}
            </p>
          </div>
        </div>
      </div>
    </PageMotion>
  );
}
