"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  generateCertificatePDF,
  generateCertificateCode,
} from "@/lib/certificate";

export async function generateStudentCertificate(courseId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Check if certificate already exists
  const existing = await prisma.certificate.findFirst({
    where: {
      userId: session.user.id,
      courseId,
    },
  });

  if (existing) return existing;

  // Verify all required modules are completed
  const requiredModules = await prisma.module.findMany({
    where: { courseId, isBonus: false },
  });

  const completedModules = await prisma.moduleProgress.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      module: { courseId, isBonus: false },
    },
  });

  if (completedModules.length < requiredModules.length) {
    throw new Error("Not all required modules are completed");
  }

  // Verify all quizzes passed
  for (const mod of requiredModules) {
    const quiz = await prisma.quiz.findUnique({
      where: { moduleId: mod.id },
    });
    if (!quiz) continue;

    const passed = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quizId: quiz.id,
        passed: true,
      },
    });

    if (!passed) {
      throw new Error(`Quiz for module "${mod.titleEn}" not passed`);
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new Error("Course not found");

  const certificateCode = generateCertificateCode();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const studentName = session.user.name || session.user.email;

  // Generate PDF
  const pdfBuffer = generateCertificatePDF({
    studentName,
    courseName: course.titleEn,
    completionDate: new Date(),
    certificateCode,
    verificationUrl: `${appUrl}/certificate/${certificateCode}/verify`,
  });

  // Store as base64 data URL (in production, upload to S3/CloudFlare R2)
  const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

  const certificate = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      courseId,
      certificateCode,
      studentName,
      courseName: course.titleEn,
      pdfUrl: pdfBase64,
    },
  });

  return certificate;
}

export async function verifyCertificate(certificateCode: string) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateCode },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!certificate) return null;

  return {
    valid: true,
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    issuedAt: certificate.issuedAt,
    certificateCode: certificate.certificateCode,
  };
}
