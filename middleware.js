import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("sb-access-token");

  if (req.nextUrl.pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
