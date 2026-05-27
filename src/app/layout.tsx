import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "SAC — Suno Access Control",
  description: "Sistema interno de gestão de acessos da Suno",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F9FAFB] font-sans antialiased">
        <Sidebar />
        <div className="ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-16 px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
