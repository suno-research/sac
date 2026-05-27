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
        <div style={{ marginLeft: "256px" }} className="flex flex-col min-h-screen">
          <Header />
          <main style={{ paddingTop: "64px" }} className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
