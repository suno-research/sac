"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type FilterBarProps = {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  children?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
  debounceMs?: number;
};

const selectClass =
  "h-11 min-w-[160px] rounded-xl border border-input bg-card px-4 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring cursor-pointer transition-colors";

export function FilterSelect({
  value,
  onChange,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(selectClass, className)}
    >
      {children}
    </select>
  );
}

export function FilterBar({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  children,
  onClear,
  showClear,
  className,
  debounceMs = 300,
}: FilterBarProps) {
  const [localValue, setLocalValue] = useState(searchValue);
  const [prevSearchValue, setPrevSearchValue] = useState(searchValue);

  if (searchValue !== prevSearchValue) {
    setPrevSearchValue(searchValue);
    setLocalValue(searchValue);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localValue !== searchValue) {
        onSearchChange(localValue);
      }
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [localValue, searchValue, onSearchChange, debounceMs]);

  return (
    <div className={cn("flex flex-wrap items-center gap-3 mb-8", className)}>
      <div className="relative min-w-[280px] flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground pointer-events-none" aria-hidden />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-11 pl-11 text-[15px] rounded-xl"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
      </div>
      {children}
      {showClear && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-2 transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
