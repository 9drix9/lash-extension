import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set locale from cookie or default
  const locale = request.cookies.get("locale")?.value || "en";
  response.headers.set("x-locale", locale);

  // Track affiliate referral
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    response.cookies.set("ref", ref, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
