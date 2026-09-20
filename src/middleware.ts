import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read demo or auth cookie if present
  const authCookie = request.cookies.get("dh_auth_role")?.value;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (authCookie && authCookie !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
