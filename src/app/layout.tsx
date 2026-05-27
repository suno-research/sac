import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  title: "SAC — Suno Access Control",
  description: "Sistema interno de gestão de acessos da Suno",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
