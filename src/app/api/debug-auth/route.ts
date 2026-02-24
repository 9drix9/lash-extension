import { NextResponse } from "next/server";

export async function GET() {
  const id = process.env.AUTH_GOOGLE_ID ?? "";
  const secret = process.env.AUTH_GOOGLE_SECRET ?? "";
  const authUrl = process.env.AUTH_URL ?? "";
  const authSecret = process.env.AUTH_SECRET ?? "";

  return NextResponse.json({
    AUTH_GOOGLE_ID_set: !!id,
    AUTH_GOOGLE_ID_preview: id ? `${id.slice(0, 12)}...` : "MISSING",
    AUTH_GOOGLE_SECRET_set: !!secret,
    AUTH_GOOGLE_SECRET_preview: secret ? `${secret.slice(0, 6)}...` : "MISSING",
    AUTH_URL: authUrl || "MISSING",
    AUTH_SECRET_set: !!authSecret,
    AUTH_SECRET_is_placeholder: authSecret === "generate-with-openssl-rand-base64-32",
  });
}
