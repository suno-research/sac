"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const FULLSCREEN_ROUTES = ["/login", "/portal"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isFullscreen) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <div
        className="min-h-screen flex flex-col"
        style={{
          marginLeft: "var(--sidebar-width)",
          width: "calc(100% - var(--sidebar-width))",
        }}
      >
        <Header />
        <main
          className="flex-1 px-6 sm:px-8 xl:px-12 pb-12"
          style={{ paddingTop: "calc(var(--header-height) + 2rem)" }}
        >
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
      </div>
    </>
  );
}
