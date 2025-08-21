import { betterFetch } from "@better-fetch/fetch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const { data: session } = await betterFetch("/api/auth/get-session", {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    
    if (!session) {
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
