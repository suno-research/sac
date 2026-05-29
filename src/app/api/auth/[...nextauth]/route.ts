import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSheetData } from "@/lib/sheets";

const ALLOWED_DOMAINS = ["suno.com.br", "sunoresearch.com.br"];

// Cache de admins para não bater no Sheets a cada request
let adminsCache: { email: string; role: string }[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getAdmins(): Promise<{ email: string; role: string }[]> {
  const now = Date.now();
  if (adminsCache.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return adminsCache;
  }
  try {
    const rows = await getSheetData("admins!A2:B");
    adminsCache = rows
      .filter((row) => row[0])
      .map((row) => ({
        email: row[0].toLowerCase().trim(),
        role: row[1]?.toLowerCase().trim() || "ti",
      }));
    cacheTimestamp = now;
    return adminsCache;
  } catch (e) {
    console.error("Erro ao buscar admins:", e);
    // Fallback para não travar o sistema se a aba não existir
    return [{ email: "daniel.lopes@suno.com.br", role: "ti" }];
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email || "";
      const domain = email.split("@")[1];
      return ALLOWED_DOMAINS.includes(domain);
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + "/dashboard";
    },
    async session({ session, token }) {
      if (session.user) {
        const email = session.user.email || "";
        const domain = email.split("@")[1];
        session.user.role = (token.role as "ti" | "gestor") ?? "gestor";
        session.user.domain = domain;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
        const admins = await getAdmins();
        const admin = admins.find(
          (a) => a.email === profile.email?.toLowerCase()
        );
        token.role = admin ? admin.role : "gestor";
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };
