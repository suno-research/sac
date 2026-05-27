import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAINS = ["suno.com.br", "sunoresearch.com.br"];
const TI_EMAILS = ["daniel.lopes@suno.com.br"];

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
        session.user.role = (token.role as "ti" | "gestor") ?? (TI_EMAILS.includes(email) ? "ti" : "gestor");
        session.user.domain = domain;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
        token.role = TI_EMAILS.includes(profile.email) ? "ti" : "gestor";
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