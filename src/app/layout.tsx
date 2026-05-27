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
      <body className="bg-[#f8fafc] font-sans antialiased">
        <Sidebar />
        <div className="ml-60 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-14 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
