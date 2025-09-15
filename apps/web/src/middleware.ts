import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic protection: use cookie presence to route unauthenticated users
  if (pathname.startsWith("/dashboard")) {
    const cookie = getSessionCookie(request);
    if (!cookie) {
      const url = new URL("/auth", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
