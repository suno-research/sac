"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [pendencias, setPendencias] = useState(0);

  useEffect(() => {
    fetch("/api/acessos")
      .then((r) => r.json())
      .then((acessos) => {
        if (!Array.isArray(acessos)) return;
        const count = acessos.filter(
          (a: { status: string }) =>
            a.status === "Pendente concessão" || a.status === "Pendente remoção"
        ).length;
        setPendencias(count);
      })
      .catch(() => setPendencias(0));
  }, []);

  const nome = session?.user?.name || "Usuário";
  const email = session?.user?.email || "";
  const foto = session?.user?.image;
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = session?.user?.role || "gestor";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 256,
        right: 0,
        zIndex: 20,
        height: 64,
        background: "white",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
      }}
      className="bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: 8,
            borderRadius: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
          }}
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          type="button"
          style={{
            position: "relative",
            padding: 8,
            borderRadius: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
          }}
          aria-label="Notificações"
        >
          <Bell size={20} />
          {pendencias > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#D42126",
              }}
            />
          )}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingLeft: 16,
            borderLeft: "1px solid #E5E7EB",
          }}
        >
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={nome} style={{ width: 32, height: 32, borderRadius: "50%" }} />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#D42126",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{nome}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{email}</p>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 6,
              background: role === "ti" ? "#FEE2E2" : "#EFF6FF",
              color: role === "ti" ? "#D42126" : "#3B82F6",
            }}
          >
            {role === "ti" ? "TI" : "Gestor"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: 8,
            borderRadius: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
          }}
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
