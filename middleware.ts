import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shankh-token")?.value;
  const isOnboarded = request.cookies.get("shankh-onboarded")?.value === "true";
  const { pathname, searchParams } = request.nextUrl;

  // Bulletproof server-side cookie clearing to break the loop
  if (searchParams.get("clear_auth") === "true") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("clear_auth");
    url.pathname = "/login";
    url.searchParams.set("redirect", "true");
    const response = NextResponse.redirect(url);
    response.cookies.delete("shankh-token");
    response.cookies.delete("shankh-onboarded");
    return response;
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isOnboardingPage = pathname === "/onboarding";
  const isLandingPage = pathname === "/";
  
  // If there is no token and the user is not on an auth page, onboarding page, or landing page, redirect to login
  if (!token) {
    if (!isAuthPage && !isOnboardingPage && !isLandingPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", "true");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If there is a token
  if (token) {
    // Prevent accessing login/signup when logged in
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = isOnboarded ? "/" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // Redirect to onboarding if not onboarded and trying to access other pages
    if (!isOnboarded && !isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Redirect onboarded users away from /onboarding
    if (isOnboarded && isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
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
