import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shankh-token")?.value;
  const { pathname, searchParams } = request.nextUrl;

  // Bulletproof server-side cookie clearing to break the loop
  if (searchParams.get("clear_auth") === "true") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("clear_auth");
    url.pathname = "/login";
    url.searchParams.set("redirect", "true");
    const response = NextResponse.redirect(url);
    response.cookies.delete("shankh-token");
    return response;
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // If there is no token and the user is not on an auth page, redirect to login
  if (!token && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", "true");
    return NextResponse.redirect(url);
  }

  // If there is a token and the user is on an auth page, redirect to dashboard
  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, manifests)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|manifest\\.json$).*)",
  ],
};
