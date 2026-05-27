"use client";

import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

type SunoLogoProps = {
  className?: string;
  height?: number;
  /** Força variante independente do tema (ex.: card de login sempre claro) */
  variant?: "auto" | "light" | "dark";
};

export function SunoLogo({ className, height = 40, variant = "auto" }: SunoLogoProps) {
  const { theme } = useTheme();
  const isDark = variant === "dark" || (variant === "auto" && theme === "dark");

  if (isDark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/suno-logo.png"
        alt="Suno"
        className={cn("h-auto w-auto object-contain object-left", className)}
        style={{ height, maxHeight: height }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/suno-logo-light.svg"
      alt="Suno"
      className={cn("h-auto w-auto object-contain object-left", className)}
      style={{ height, maxHeight: height }}
    />
  );
}
