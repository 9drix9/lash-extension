"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initializeModuleProgress } from "./progress";
import { revalidatePath } from "next/cache";

export async function enrollInCourse(courseId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Check if already enrolled
  const existing = await prisma.moduleProgress.findFirst({
    where: {
      userId: session.user.id,
      module: { courseId },
    },
  });

  if (existing) return { alreadyEnrolled: true };

  // Update user enrollment date
  await prisma.user.update({
    where: { id: session.user.id },
    data: { enrolledAt: new Date() },
  });

  // Initialize module progress
  await initializeModuleProgress(session.user.id, courseId);

  // Track affiliate conversion if referral code exists
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.referralCode) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: user.referralCode, status: "APPROVED" },
    });

    if (affiliate && affiliate.userId !== session.user.id) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      const amount = course?.price || 0;
      const commission = Math.round(
        amount * (affiliate.commissionRate / 100)
      );

      await prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliate.id,
          email: session.user.email,
          amount,
          commission,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  return { enrolled: true };
}

export async function getActiveCourse() {
  const course = await prisma.course.findFirst({
    where: { published: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          quiz: true,
        },
      },
    },
  });
  return course;
}
