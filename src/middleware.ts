import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Rotas restritas apenas para TI
    const rotasTI = ["/funcionarios/novo"];
    if (rotasTI.some((rota) => pathname.startsWith(rota))) {
      if (token?.role !== "ti") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/funcionarios/:path*",
    "/ferramentas/:path*",
    "/perfis/:path*",
    "/pendencias/:path*",
    "/offboarding/:path*",
  ],
};
