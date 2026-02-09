"use server";

import { prisma } from "@/lib/prisma";

export async function hasActivePayment(
  userId: string,
  courseId: string
): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
  });
  return !!payment;
}

export async function getUserPayment(userId: string, courseId: string) {
  return prisma.payment.findFirst({
    where: {
      userId,
      courseId,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTransactions() {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get unique courseIds and fetch course names
  const courseIds = [...new Set(payments.map((p) => p.courseId))];
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, titleEn: true, titleEs: true },
  });
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  return payments.map((p) => ({
    id: p.id,
    userName: p.user.name || "Unknown",
    userEmail: p.user.email,
    userImage: p.user.image,
    userId: p.user.id,
    courseName: courseMap.get(p.courseId)?.titleEn || "Unknown Course",
    courseNameEs: courseMap.get(p.courseId)?.titleEs || "",
    paymentType: p.paymentType,
    status: p.status,
    amountTotal: p.amountTotal,
    amountPaid: p.amountPaid,
    installmentsTotal: p.installmentsTotal,
    installmentsPaid: p.installmentsPaid,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}
