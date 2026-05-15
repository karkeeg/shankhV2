import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shankh-token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/login";

  // If there is no token and the user is not on the login page, redirect to login
  if (!token && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If there is a token and the user is on the login page, redirect to dashboard
  if (token && isLoginPage) {
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
     * - logo.svg (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};
