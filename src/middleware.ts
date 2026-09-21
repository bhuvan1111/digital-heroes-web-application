import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const dhRoleCookie = request.cookies.get("dh_role")?.value;
  const dhUserCookie = request.cookies.get("dh_demo_user")?.value;

  let userRole = dhRoleCookie;
  if (!userRole && dhUserCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dhUserCookie));
      userRole = parsed?.role;
    } catch {}
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder");

  let supabaseUser = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      supabaseUser = data.user;
      if (supabaseUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", supabaseUser.id)
          .maybeSingle();

        if (profile?.role) {
          userRole = profile.role;
        }
      }
    } catch {}
  }

  // Protect /admin routes - must have role === 'admin'
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      // If signed in as subscriber or general user, redirect to subscriber dashboard
      if (userRole === "user" || supabaseUser) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/overview";
        return NextResponse.redirect(url);
      }
      // If unauthenticated, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect /dashboard routes - must have role === 'user' or role === 'admin' or supabaseUser
  if (pathname.startsWith("/dashboard")) {
    if (!userRole && !supabaseUser) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
