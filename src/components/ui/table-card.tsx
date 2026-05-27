import { cn } from "@/lib/utils";

type TableCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function TableCard({ title, action, children, className }: TableCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-card overflow-hidden",
        className
      )}
    >
      <div className="px-8 xl:px-10 py-6 border-b border-border flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto px-1 pb-2">{children}</div>
    </div>
  );
}
