import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Reachable while signed out. Everything else under the matcher needs a session,
// and /admin/* additionally needs the admin role.
const PUBLIC_PATHS = ["/admin/login", "/account/login", "/account/register"];

function loginRedirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin")) {
    if (user?.app_metadata?.role !== "admin") {
      return loginRedirect(request, "/admin/login");
    }
    return response;
  }

  // Any other matched path is a customer page, so a session is enough.
  if (!user) {
    return loginRedirect(request, "/account/login");
  }

  return response;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
