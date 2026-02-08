import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type");

  if (type === "students") {
    return exportStudents();
  }
  if (type === "progress") {
    return exportProgress();
  }
  if (type === "quizzes") {
    return exportQuizzes();
  }
  if (type === "certificates") {
    return exportCertificates();
  }

  return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
}

function csvRow(values: (string | number | null)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      const str = String(v);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

function csvResponse(filename: string, headers: string[], rows: string[]): NextResponse {
  const csv = [csvRow(headers), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportStudents() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      moduleProgress: { where: { status: "COMPLETED" } },
      _count: { select: { quizAttempts: true, certificates: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Name",
    "Email",
    "Enrolled",
    "Last Activity",
    "Completed Modules",
    "Quiz Attempts",
    "Certificates",
    "Payment Status",
    "Amount Paid",
  ];

  const rows = students.map((s) =>
    csvRow([
      s.name || "",
      s.email,
      s.enrolledAt?.toISOString() || "",
      s.lastActivityAt?.toISOString() || "",
      s.moduleProgress.length,
      s._count.quizAttempts,
      s._count.certificates,
      s.payments[0]?.status || "",
      s.payments[0]?.amountPaid
        ? (s.payments[0].amountPaid / 100).toFixed(2)
        : "",
    ])
  );

  return csvResponse("students.csv", headers, rows);
}

async function exportProgress() {
  const progress = await prisma.moduleProgress.findMany({
    include: {
      user: { select: { name: true, email: true } },
      module: { select: { titleEn: true, order: true } },
    },
    orderBy: [{ module: { order: "asc" } }, { userId: "asc" }],
  });

  const headers = [
    "Student Name",
    "Email",
    "Module Order",
    "Module Title",
    "Status",
    "Started",
    "Updated",
  ];

  const rows = progress.map((p) =>
    csvRow([
      p.user.name || "",
      p.user.email,
      p.module.order,
      p.module.titleEn,
      p.status,
      p.createdAt.toISOString(),
      p.updatedAt.toISOString(),
    ])
  );

  return csvResponse("progress.csv", headers, rows);
}

async function exportQuizzes() {
  const attempts = await prisma.quizAttempt.findMany({
    include: {
      user: { select: { name: true, email: true } },
      quiz: {
        select: {
          titleEn: true,
          module: { select: { titleEn: true, order: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Student Name",
    "Email",
    "Module",
    "Quiz",
    "Attempt #",
    "Score",
    "Passed",
    "Date",
  ];

  const rows = attempts.map((a) =>
    csvRow([
      a.user.name || "",
      a.user.email,
      `M${a.quiz.module.order}: ${a.quiz.module.titleEn}`,
      a.quiz.titleEn,
      a.attemptNumber,
      Math.round(a.score),
      a.passed ? "Yes" : "No",
      a.createdAt.toISOString(),
    ])
  );

  return csvResponse("quiz-attempts.csv", headers, rows);
}

async function exportCertificates() {
  const certs = await prisma.certificate.findMany({
    include: {
      user: { select: { email: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const headers = [
    "Student Name",
    "Email",
    "Course",
    "Certificate Code",
    "Issued At",
  ];

  const rows = certs.map((c) =>
    csvRow([
      c.studentName,
      c.user.email,
      c.courseName,
      c.certificateCode,
      c.issuedAt.toISOString(),
    ])
  );

  return csvResponse("certificates.csv", headers, rows);
}
