"use client";

import { usePathname } from "next/navigation";
import type { PlatformModule } from "@/types/platform";

export function useActiveModule(): PlatformModule {
  const pathname = usePathname();
  if (pathname.startsWith("/sec")) return "sec";
  return "sac";
}
