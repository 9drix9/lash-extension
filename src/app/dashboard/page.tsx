import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocalizedField } from "@/lib/utils";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const t = await getTranslations("dashboard");
  const locale = session.user.locale || "en";

  // Get course
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
      milestones: true,
    },
  });

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t("noCourse")}</h2>
          <p className="text-muted-foreground">{t("enrollPrompt")}</p>
        </div>
      </div>
    );
  }

  // Check enrollment
  const enrollment = await prisma.moduleProgress.findFirst({
    where: { userId: session.user.id, module: { courseId: course.id } },
  });

  if (!enrollment) redirect("/enroll");

  // Get all progress data
  const moduleProgress = await prisma.moduleProgress.findMany({
    where: { userId: session.user.id, module: { courseId: course.id } },
  });

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lesson: { module: { courseId: course.id } } },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id, quiz: { module: { courseId: course.id } } },
    orderBy: { createdAt: "desc" },
  });

  const milestoneAwards = await prisma.milestoneAward.findMany({
    where: { userId: session.user.id, milestone: { courseId: course.id } },
    include: { milestone: true },
  });

  const certificate = await prisma.certificate.findFirst({
    where: { userId: session.user.id, courseId: course.id },
  });

  // Build module data
  const modulesData = course.modules.map((mod) => {
    const progress = moduleProgress.find((mp) => mp.moduleId === mod.id);
    const status = progress?.status || (mod.isBonus ? "UNLOCKED" : "LOCKED");

    const quizId = mod.quiz?.id;
    const bestAttempt = quizId
      ? quizAttempts
          .filter((a) => a.quizId === quizId)
          .sort((a, b) => b.score - a.score)[0]
      : null;
    const quizPassed = quizId
      ? quizAttempts.some((a) => a.quizId === quizId && a.passed)
      : false;

    const completedLessons = mod.lessons.filter((l) =>
      lessonProgress.some((lp) => lp.lessonId === l.id && lp.completed)
    ).length;

    return {
      id: mod.id,
      title: getLocalizedField(mod, "title", locale),
      subtitle: getLocalizedField(mod, "subtitle", locale),
      imageUrl: mod.imageUrl,
      order: mod.order,
      isBonus: mod.isBonus,
      status: status as "LOCKED" | "UNLOCKED" | "COMPLETED",
      quizPassed,
      quizId: quizId || null,
      bestScore: bestAttempt ? Math.round(bestAttempt.score) : null,
      totalLessons: mod.lessons.length,
      completedLessons,
    };
  });

  const requiredModules = modulesData.filter((m) => !m.isBonus);
  const completedCount = requiredModules.filter((m) => m.status === "COMPLETED").length;
  const progressPercent = requiredModules.length > 0
    ? Math.round((completedCount / requiredModules.length) * 100)
    : 0;

  // Find next action
  const nextModule = modulesData.find(
    (m) => m.status === "UNLOCKED" && !m.isBonus
  );

  const milestones = milestoneAwards.map((ma) => ({
    id: ma.milestoneId,
    title: getLocalizedField(ma.milestone, "title", locale),
    message: getLocalizedField(ma.milestone, "message", locale),
    badgeEmoji: ma.milestone.badgeEmoji,
    nextStep: getLocalizedField(ma.milestone, "nextStep", locale),
    awardedAt: ma.awardedAt.toISOString(),
  }));

  return (
    <DashboardClient
      userName={session.user.name || session.user.email}
      modules={modulesData}
      progressPercent={progressPercent}
      completedCount={completedCount}
      totalRequired={requiredModules.length}
      nextModule={nextModule || null}
      milestones={milestones}
      certificate={certificate ? {
        code: certificate.certificateCode,
        pdfUrl: certificate.pdfUrl,
      } : null}
      courseId={course.id}
      allComplete={completedCount >= requiredModules.length}
    />
  );
}
