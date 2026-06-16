import { cn } from "@/lib/utils";

type TableCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function TableCard({ title, action, children, className, contentClassName }: TableCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card shadow-card overflow-hidden",
        className
      )}
    >
      <div className="px-8 xl:px-10 py-6 border-b border-border flex items-center justify-between gap-4 min-w-0">
        <h2 className="text-base font-semibold text-foreground tracking-tight truncate">{title}</h2>
        {action}
      </div>
      <div
        className={cn(
          "min-w-0 pb-2",
          contentClassName ?? "overflow-hidden max-lg:overflow-x-auto"
        )}
      >
        {children}
      </div>
    </div>
  );
}
