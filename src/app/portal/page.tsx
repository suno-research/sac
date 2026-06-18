"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Monitor, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SunoLogo } from "@/components/layout/SunoLogo";
import { MODULES } from "@/types/platform";
import type { ModuleDefinition } from "@/types/platform";

const moduleIcons: Record<string, React.ElementType> = {
  sac: ShieldCheck,
  sec: Monitor,
};

const statusConfig = {
  active:      { label: "Ativo",    icon: CheckCircle2, className: "text-success bg-success-muted" },
  beta:        { label: "Beta",     icon: Clock,        className: "text-warning bg-warning-muted" },
  coming_soon: { label: "Em breve", icon: Clock,        className: "text-muted-foreground bg-muted" },
} as const;

function ModuleCard({ module, index }: { module: ModuleDefinition; index: number }) {
  const Icon       = moduleIcons[module.id] ?? ShieldCheck;
  const status     = statusConfig[module.status];
  const StatusIcon = status.icon;
  const isDisabled = module.status === "coming_soon";

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-6">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          module.id === "sec"
            ? "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400"
            : "bg-accent-muted text-accent"
        )}>
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold", status.className)}>
          <StatusIcon className="h-3 w-3" aria-hidden />
          {status.label}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-xl font-bold text-foreground">{module.name}</h2>
          <span className="text-sm text-muted-foreground font-medium">— {module.fullName}</span>
        </div>
        <p className="text-[14px] text-muted-foreground leading-relaxed">{module.description}</p>
      </div>
      <div className={cn(
        "mt-6 flex items-center gap-2 text-[14px] font-semibold",
        isDisabled ? "text-muted-foreground" : module.id === "sec" ? "text-blue-500 dark:text-blue-400" : "text-accent"
      )}>
        {isDisabled ? "Disponível em breve" : `Acessar ${module.name}`}
        {!isDisabled && <ArrowRight className="h-4 w-4" aria-hidden />}
      </div>
    </>
  );

  const cardClass = cn(
    "flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200",
    isDisabled
      ? "opacity-60 cursor-not-allowed border-border"
      : cn(
          "cursor-pointer border-border hover:shadow-md hover:-translate-y-0.5",
          module.id === "sec"
            ? "hover:border-blue-500/40 dark:hover:border-blue-400/30"
            : "hover:border-accent/30"
        )
  );

  return (
    <motion.div
      key={module.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
    >
      {isDisabled ? (
        <div className={cardClass}>{cardContent}</div>
      ) : (
        <Link href={module.href} className={cardClass}>{cardContent}</Link>
      )}
    </motion.div>
  );
}

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") return null;

  const nome = session?.user?.name?.split(" ")[0] ?? "Olá";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12 text-center"
      >
        <SunoLogo height={40} className="mx-auto mb-8 max-w-[160px]" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Olá, {nome} 👋</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">Selecione o módulo que deseja acessar.</p>
      </motion.div>
      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {MODULES.map((module, index) => (
          <ModuleCard key={module.id} module={module} index={index} />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-10 text-xs text-muted-foreground"
      >
        Suno Operations Platform · v1.0
      </motion.p>
    </div>
  );
}
