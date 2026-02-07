"use server";

import { prisma } from "@/lib/prisma";
import { initializeModuleProgress } from "./progress";
import { revalidatePath } from "next/cache";

/**
 * Enroll a user in a course. Should only be called after payment is confirmed
 * (from the Stripe webhook handler).
 */
export async function enrollInCourse(userId: string, courseId: string) {
  // Check if already enrolled
  const existing = await prisma.moduleProgress.findFirst({
    where: {
      userId,
      module: { courseId },
    },
  });

  if (existing) return { alreadyEnrolled: true };

  // Update user enrollment date
  await prisma.user.update({
    where: { id: userId },
    data: { enrolledAt: new Date() },
  });

  // Initialize module progress
  await initializeModuleProgress(userId, courseId);

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
