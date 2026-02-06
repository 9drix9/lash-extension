import { NextRequest, NextResponse } from "next/server";
import { trackAffiliateClick } from "@/lib/actions/affiliate";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("ref");
  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
  const userAgent = request.headers.get("user-agent") || undefined;

  await trackAffiliateClick(code, ip, userAgent);

  // Set cookie for attribution
  const response = NextResponse.redirect(new URL("/enroll", request.url));
  response.cookies.set("ref", code, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    path: "/",
  });

  return response;
}
