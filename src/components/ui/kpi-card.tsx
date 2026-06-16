"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconClassName?: string;
  index?: number;
  href?: string;
};

export function KpiCard({ label, value, icon, iconClassName, index = 0, href }: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <span className="text-sm font-medium text-muted-foreground leading-relaxed pr-2">
          {label}
        </span>
        <div
          className={cn(
            "p-3 rounded-xl bg-muted flex-shrink-0 text-muted-foreground",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-5xl xl:text-[3.25rem] font-semibold tracking-tight text-foreground leading-none tabular-nums">
        {value}
      </p>
    </>
  );

  const className = cn(
    "rounded-xl border border-border bg-card p-8 xl:p-9 min-h-[180px]",
    "flex flex-col justify-between shadow-card",
    "hover:shadow-elevated hover:border-border/80 transition-all duration-200",
    href && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      {href ? (
        <Link href={href} className={className} aria-label={`${label}: ${value}`}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </motion.div>
  );
}
