import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSecSheetData } from "@/lib/sec-sheets";
import { rowToAuditLog } from "@/lib/sec-audit";

function secErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.includes("GOOGLE_SHEETS_SEC_ID")
    ? "Planilha SEC não configurada. Defina GOOGLE_SHEETS_SEC_ID."
    : fallback;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ti") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      500,
      Math.max(1, parseInt(searchParams.get("limit") ?? "0", 10) || 0)
    );

    const rows = await getSecSheetData("_AUDITORIA!A2:N");
    const logs = rows
      .map(rowToAuditLog)
      .filter((log) => log.audit_id.trim() !== "")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    if (limit > 0) {
      const start = (page - 1) * limit;
      const paginated = logs.slice(start, start + limit);
      return NextResponse.json({
        data: paginated,
        total: logs.length,
        page,
        limit,
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao buscar auditoria SEC:", error);
    return NextResponse.json(
      {
        error: secErrorMessage(
          error,
          "Erro ao buscar auditoria. Verifique a aba _AUDITORIA na planilha SEC."
        ),
      },
      { status: 500 }
    );
  }
}
