"use client";

import { PageMotion } from "@/components/ui/page-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Package } from "lucide-react";

type SECPlaceholderProps = {
  sprint: number;
  title?: string;
  description?: string;
};

export function SECPlaceholder({
  sprint,
  title = "Em breve",
  description,
}: SECPlaceholderProps) {
  return (
    <PageMotion>
      <PageHeader
        title={title}
        description={
          description ??
          `Este módulo será implementado na Sprint ${sprint} do SEC.`
        }
      />
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm">
        <Package
          className="mb-4 h-10 w-10 text-blue-500 dark:text-blue-400"
          aria-hidden
        />
        <p className="text-sm font-medium text-foreground">
          Disponível na Sprint {sprint}
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          A equipe está trabalhando nesta funcionalidade.
        </p>
      </div>
    </PageMotion>
  );
}
