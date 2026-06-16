"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 50, 100];

type TablePaginationProps = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
};

export function TablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  itemLabel = "itens",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4",
        "bg-gradient-to-b from-muted/10 to-muted/25 dark:from-muted/5 dark:to-muted/15"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{start}</span>
          <span className="mx-0.5">–</span>
          <span className="font-medium tabular-nums text-foreground">{end}</span>
          <span className="mx-1">de</span>
          <span className="font-medium tabular-nums text-foreground">{totalItems}</span>
          <span className="ml-1">{itemLabel}</span>
        </p>
        <label className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium">Exibir</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Quantidade por página"
            className={cn(
              "h-8 min-w-[4.25rem] cursor-pointer rounded-lg border border-border/80 bg-card px-2.5",
              "text-xs font-medium text-foreground shadow-xs",
              "transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-accent/25"
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-xs">por página</span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs font-medium text-muted-foreground sm:min-w-[6.5rem] sm:text-center">
          Página{" "}
          <span className="tabular-nums text-foreground">{currentPage}</span>
          {" "}de{" "}
          <span className="tabular-nums text-foreground">{totalPages}</span>
        </span>
        <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrev}
              aria-label="Página anterior"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80",
                "bg-card text-muted-foreground shadow-xs transition-all duration-150",
                "hover:border-border hover:bg-muted/60 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                "disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
              )}
            >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Próxima página"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80",
              "bg-card text-muted-foreground shadow-xs transition-all duration-150",
              "hover:border-border hover:bg-muted/60 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              "disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
