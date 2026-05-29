"use client";

import { cn } from "@/lib/utils";

type SunoLogoProps = {
  className?: string;
  height?: number;
};

export function SunoLogo({ className, height = 44 }: SunoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/suno-logo.png"
      alt="Suno"
      className={cn("object-contain object-left", className)}
      style={{ height, width: "auto" }}
    />
  );
}
