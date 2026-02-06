import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateCode: string }> }
) {
  const { certificateCode } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateCode },
  });

  if (!certificate || !certificate.pdfUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If PDF is stored as base64 data URL
  if (certificate.pdfUrl.startsWith("data:")) {
    const base64Data = certificate.pdfUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificateCode}.pdf"`,
      },
    });
  }

  // If PDF is an external URL, redirect
  return NextResponse.redirect(certificate.pdfUrl);
}
