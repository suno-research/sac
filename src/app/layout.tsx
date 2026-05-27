import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "SAC — Suno Access Control",
  description: "Sistema interno de gestão de acessos de funcionários da Suno",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Sidebar />
        <Header />
        <main className="ml-60 mt-14 min-h-[calc(100vh-3.5rem)] bg-[#f8fafc]">
          {children}
        </main>
      </body>
    </html>
  );
}
