import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isProtectedPath } from "@/lib/auth/paths";
import { hasStaffAccess } from "@/lib/auth/permissions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isUserRole } from "@/lib/auth/types";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  if (!isPublicSupabaseConfigured()) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_ROUTES.login;
    loginUrl.search = "";
    const next = getSafeRedirectPath(`${pathname}${request.nextUrl.search}`, pathname);
    loginUrl.searchParams.set("next", next);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (pathname === AUTH_ROUTES.unauthorized || pathname.startsWith("/admin")) {
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const role = data?.role;
      if (pathname.startsWith("/admin") && !hasStaffAccess(isUserRole(role) ? role : null)) {
        const unauthorized = request.nextUrl.clone();
        unauthorized.pathname = AUTH_ROUTES.unauthorized;
        unauthorized.search = "";
        const redirectResponse = NextResponse.redirect(unauthorized);
        copyCookies(response, redirectResponse);
        return redirectResponse;
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
