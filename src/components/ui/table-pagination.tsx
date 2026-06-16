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
    <div className="flex flex-col gap-4 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>
          Exibindo {start}–{end} de {totalItems} {itemLabel}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium">Por página</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Quantidade por página"
            className={cn(
              "h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent/30"
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          aria-label="Página anterior"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border",
            "bg-card text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[7rem] text-center text-xs font-medium text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Próxima página"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border",
            "bg-card text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
