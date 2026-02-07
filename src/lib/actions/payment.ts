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
