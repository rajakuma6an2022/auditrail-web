import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 "proxy" (formerly middleware). Cheap gate only: checks that a session cookie exists.
// Real validation happens on the API (/auth/me and every data endpoint).
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("auditrail_session");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/events/:path*"],
};