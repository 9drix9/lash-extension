"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

// ─── DASHBOARD STATS ─────────────────────────────────

export async function getAdminStats() {
  await requireAdmin();

  const [
    totalStudents,
    enrolledStudents,
    totalAttempts,
    passedAttempts,
    avgScore,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", enrolledAt: { not: null } } }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { passed: true } }),
    prisma.quizAttempt.aggregate({ _avg: { score: true } }),
  ]);

  // Completion rate
  const completedStudents = await prisma.certificate.groupBy({
    by: ["userId"],
  });

  const completionRate =
    enrolledStudents > 0
      ? Math.round((completedStudents.length / enrolledStudents) * 100)
      : 0;

  return {
    totalStudents,
    enrolledStudents,
    completionRate,
    avgQuizScore: Math.round(avgScore._avg.score || 0),
    totalAttempts,
    passedAttempts,
  };
}

// ─── STUDENT MANAGEMENT ──────────────────────────────

export async function getStudents() {
  await requireAdmin();

  return prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      _count: {
        select: {
          quizAttempts: true,
          certificates: true,
        },
      },
      moduleProgress: {
        where: { status: "COMPLETED" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resetStudentProgress(studentId: string) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { userId: studentId } }),
    prisma.moduleProgress.deleteMany({ where: { userId: studentId } }),
    prisma.quizAttempt.deleteMany({ where: { userId: studentId } }),
    prisma.milestoneAward.deleteMany({ where: { userId: studentId } }),
    prisma.certificate.deleteMany({ where: { userId: studentId } }),
  ]);

  // Re-initialize from first module
  const course = await prisma.course.findFirst({ where: { published: true } });
  if (course) {
    const modules = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
    });

    for (let i = 0; i < modules.length; i++) {
      await prisma.moduleProgress.create({
        data: {
          userId: studentId,
          moduleId: modules[i].id,
          status: i === 0 ? "UNLOCKED" : modules[i].isBonus ? "UNLOCKED" : "LOCKED",
        },
      });
    }
  }

  revalidatePath("/admin/students");
}

// ─── COURSE MANAGEMENT ───────────────────────────────

export async function updatePassingScore(courseId: string, score: number) {
  await requireAdmin();

  if (score < 1 || score > 100) throw new Error("Score must be 1-100");

  await prisma.course.update({
    where: { id: courseId },
    data: { passingScore: score },
  });

  revalidatePath("/admin");
}

export async function updateQuizPassingScore(
  quizId: string,
  score: number | null
) {
  await requireAdmin();

  if (score !== null && (score < 1 || score > 100)) {
    throw new Error("Score must be 1-100 or null for course default");
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { passingScore: score },
  });

  revalidatePath("/admin/quizzes");
}

// ─── MODULE MANAGEMENT ───────────────────────────────

export async function updateModule(
  moduleId: string,
  data: {
    titleEn?: string;
    titleEs?: string;
    subtitleEn?: string;
    subtitleEs?: string;
    descEn?: string;
    descEs?: string;
    imageUrl?: string;
  }
) {
  await requireAdmin();

  await prisma.module.update({
    where: { id: moduleId },
    data,
  });

  revalidatePath("/admin/modules");
}

// ─── QUESTION MANAGEMENT ─────────────────────────────

export async function createQuestion(
  quizId: string,
  data: {
    type: "MCQ" | "SCENARIO";
    questionEn: string;
    questionEs?: string;
    scenarioEn?: string;
    scenarioEs?: string;
    options: { id: string; textEn: string; textEs: string }[];
    correctOptionId: string;
    explanationEn?: string;
    explanationEs?: string;
  }
) {
  await requireAdmin();

  const maxOrder = await prisma.question.aggregate({
    where: { quizId },
    _max: { order: true },
  });

  await prisma.question.create({
    data: {
      quizId,
      type: data.type,
      questionEn: data.questionEn,
      questionEs: data.questionEs || "",
      scenarioEn: data.scenarioEn,
      scenarioEs: data.scenarioEs,
      options: data.options,
      correctOptionId: data.correctOptionId,
      explanationEn: data.explanationEn || "",
      explanationEs: data.explanationEs || "",
      order: (maxOrder._max.order || 0) + 1,
    },
  });

  revalidatePath("/admin/quizzes");
}

export async function updateQuestion(
  questionId: string,
  data: {
    questionEn?: string;
    questionEs?: string;
    scenarioEn?: string;
    scenarioEs?: string;
    options?: { id: string; textEn: string; textEs: string }[];
    correctOptionId?: string;
    explanationEn?: string;
    explanationEs?: string;
  }
) {
  await requireAdmin();

  await prisma.question.update({
    where: { id: questionId },
    data,
  });

  revalidatePath("/admin/quizzes");
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin();

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath("/admin/quizzes");
}

// ─── AFFILIATE MANAGEMENT ────────────────────────────

export async function getAffiliates() {
  await requireAdmin();

  return prisma.affiliate.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: {
        select: { clicks: true, conversions: true },
      },
      conversions: {
        select: { commission: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAffiliateStatus(
  affiliateId: string,
  status: "APPROVED" | "REJECTED",
  commissionRate?: number
) {
  await requireAdmin();

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: {
      status,
      ...(commissionRate !== undefined ? { commissionRate } : {}),
    },
  });

  revalidatePath("/admin/affiliates");
}

export async function createPayout(affiliateId: string, amount: number) {
  await requireAdmin();

  await prisma.payout.create({
    data: {
      affiliateId,
      amount,
      status: "PENDING",
    },
  });

  revalidatePath("/admin/affiliates");
}

export async function markPayoutPaid(payoutId: string) {
  await requireAdmin();

  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "PAID", paidAt: new Date() },
  });

  revalidatePath("/admin/affiliates");
}

// ─── LIVE SESSION MANAGEMENT ─────────────────────────

export async function createLiveSession(data: {
  titleEn: string;
  titleEs?: string;
  descEn?: string;
  descEs?: string;
  scheduledAt: Date;
  durationMin?: number;
  joinUrl: string;
}) {
  await requireAdmin();

  await prisma.liveSession.create({
    data: {
      titleEn: data.titleEn,
      titleEs: data.titleEs || "",
      descEn: data.descEn || "",
      descEs: data.descEs || "",
      scheduledAt: data.scheduledAt,
      durationMin: data.durationMin || 60,
      joinUrl: data.joinUrl,
    },
  });

  revalidatePath("/admin/live-sessions");
  revalidatePath("/live");
}

export async function updateLiveQuestionStatus(
  questionId: string,
  status: "ANSWERED" | "PINNED" | "PENDING"
) {
  await requireAdmin();

  await prisma.liveQuestion.update({
    where: { id: questionId },
    data: {
      status,
      ...(status === "ANSWERED" ? { answeredAt: new Date() } : {}),
    },
  });

  revalidatePath("/live");
}

export async function addSessionReplay(sessionId: string, replayUrl: string, notes?: string) {
  await requireAdmin();

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      replayUrl,
      ...(notes ? { notesEn: notes } : {}),
    },
  });

  revalidatePath("/live");
}
