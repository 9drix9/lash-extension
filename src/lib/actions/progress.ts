"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(lessonId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      completed: true,
      completedAt: new Date(),
      watchedPercent: 100,
    },
    create: {
      userId: session.user.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
      watchedPercent: 100,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActivityAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/module`);
}

export async function updateVideoProgress(
  lessonId: string,
  watchedPercent: number
) {
  const session = await auth();
  if (!session?.user) return;

  const existing = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
  });

  const shouldComplete = watchedPercent >= 90;

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      watchedPercent: Math.max(existing?.watchedPercent || 0, watchedPercent),
      ...(shouldComplete && !existing?.completed
        ? { completed: true, completedAt: new Date() }
        : {}),
    },
    create: {
      userId: session.user.id,
      lessonId,
      watchedPercent,
      completed: shouldComplete,
      completedAt: shouldComplete ? new Date() : null,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActivityAt: new Date() },
  });
}

export async function getStudentProgress(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" } },
      quiz: true,
      moduleProgress: {
        where: { userId: session.user.id },
      },
    },
  });

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: { module: { courseId } },
    },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      quiz: { module: { courseId } },
    },
    orderBy: { createdAt: "desc" },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  return {
    modules,
    lessonProgress,
    quizAttempts,
    passingScore: course?.passingScore || 80,
  };
}

export async function initializeModuleProgress(
  userId: string,
  courseId: string
) {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const status = i === 0 ? "UNLOCKED" : mod.isBonus ? "UNLOCKED" : "LOCKED";

    await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        userId,
        moduleId: mod.id,
        status,
      },
    });
  }
}

export async function unlockNextModule(userId: string, moduleId: string) {
  const currentModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });
  if (!currentModule) return;

  // Mark current module as completed
  await prisma.moduleProgress.upsert({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
    update: { status: "COMPLETED" },
    create: {
      userId,
      moduleId,
      status: "COMPLETED",
    },
  });

  // Find next module
  const nextModule = await prisma.module.findFirst({
    where: {
      courseId: currentModule.courseId,
      order: currentModule.order + 1,
      isBonus: false,
    },
  });

  if (nextModule) {
    await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId: nextModule.id,
        },
      },
      update: { status: "UNLOCKED" },
      create: {
        userId,
        moduleId: nextModule.id,
        status: "UNLOCKED",
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastActivityAt: new Date() },
  });

  // Check milestones
  await checkMilestones(userId, currentModule.courseId);

  revalidatePath("/dashboard");
}

async function checkMilestones(userId: string, courseId: string) {
  const allModules = await prisma.module.findMany({
    where: { courseId, isBonus: false },
  });
  const completedModules = await prisma.moduleProgress.findMany({
    where: { userId, status: "COMPLETED", module: { courseId, isBonus: false } },
  });

  const total = allModules.length;
  const completed = completedModules.length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  const triggers: string[] = [];

  if (completed === 1) triggers.push("FIRST_MODULE");
  if (percent >= 25 && percent < 50) triggers.push("QUARTER");
  if (percent >= 50 && percent < 75) triggers.push("HALF");
  if (percent >= 75 && percent < 100) triggers.push("THREE_QUARTER");
  if (percent >= 100) triggers.push("COURSE_COMPLETE");

  // Check first quiz pass
  const quizPasses = await prisma.quizAttempt.findFirst({
    where: { userId, passed: true, quiz: { module: { courseId } } },
  });
  if (quizPasses) triggers.push("FIRST_QUIZ_PASS");

  for (const trigger of triggers) {
    const milestone = await prisma.milestone.findFirst({
      where: { courseId, triggerType: trigger },
    });
    if (!milestone) continue;

    await prisma.milestoneAward.upsert({
      where: {
        userId_milestoneId: {
          userId,
          milestoneId: milestone.id,
        },
      },
      update: {},
      create: {
        userId,
        milestoneId: milestone.id,
      },
    });
  }
}
