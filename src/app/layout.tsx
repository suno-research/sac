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
      <body style={{ margin: 0, padding: 0, backgroundColor: "#F9FAFB" }}>
        <Sidebar />
        <div style={{
          marginLeft: "256px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 256px)"
        }}>
          <Header />
          <main style={{
            paddingTop: "80px",
            paddingLeft: "48px",
            paddingRight: "48px",
            paddingBottom: "48px",
            flex: 1
          }}>
            <div style={{
              maxWidth: "1100px",
              marginLeft: "auto",
              marginRight: "auto",
              width: "100%"
            }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
