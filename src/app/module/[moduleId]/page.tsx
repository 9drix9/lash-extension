import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocalizedField } from "@/lib/utils";
import { hasActivePayment } from "@/lib/actions/payment";
import { ModuleClient } from "./module-client";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "es" ? "es" : "en";

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: { orderBy: { order: "asc" } },
      quiz: true,
      course: true,
    },
  });

  if (!mod) notFound();

  // Check payment
  const paid = await hasActivePayment(session.user.id, mod.courseId);
  if (!paid) redirect("/enroll");

  // Check access
  const moduleProgress = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: {
        userId: session.user.id,
        moduleId,
      },
    },
  });

  if (!moduleProgress || moduleProgress.status === "LOCKED") {
    redirect("/dashboard");
  }

  // Get lesson progress
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: mod.lessons.map((l) => l.id) },
    },
  });

  // Get quiz attempts
  const quizAttempts = mod.quiz
    ? await prisma.quizAttempt.findMany({
        where: {
          userId: session.user.id,
          quizId: mod.quiz.id,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const lessons = mod.lessons.map((lesson) => {
    const progress = lessonProgress.find((lp) => lp.lessonId === lesson.id);
    return {
      id: lesson.id,
      title: getLocalizedField(lesson, "title", locale),
      content: getLocalizedField(lesson, "content", locale),
      order: lesson.order,
      videoProvider: lesson.videoProvider,
      videoUrl: lesson.videoUrl,
      videoPoster: lesson.videoPoster,
      downloadUrl: lesson.downloadUrl,
      downloadLabel: lesson.downloadLabel,
      completed: progress?.completed || false,
      watchedPercent: progress?.watchedPercent || 0,
    };
  });

  const quizPassed = quizAttempts.some((a) => a.passed);
  const allLessonsComplete = lessons.every((l) => l.completed);

  return (
    <ModuleClient
      moduleId={mod.id}
      moduleTitle={getLocalizedField(mod, "title", locale)}
      moduleDesc={getLocalizedField(mod, "desc", locale)}
      moduleOrder={mod.order}
      isBonus={mod.isBonus}
      lessons={lessons}
      quizId={mod.quiz?.id || null}
      quizPassed={quizPassed}
      allLessonsComplete={allLessonsComplete}
      status={moduleProgress.status}
    />
  );
}
