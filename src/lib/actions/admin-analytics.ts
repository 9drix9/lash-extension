"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

// ─── ENHANCED OVERVIEW STATS ────────────────────────

export async function getEnhancedAdminStats() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    enrolledStudents,
    activeToday,
    active7d,
    totalAttempts,
    passedAttempts,
    avgScore,
    revenue,
    certificates,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({
      where: { role: "STUDENT", enrolledAt: { not: null } },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        lastActivityAt: { gte: startOfToday },
      },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        lastActivityAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { passed: true } }),
    prisma.quizAttempt.aggregate({ _avg: { score: true } }),
    prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    }),
    prisma.certificate.groupBy({ by: ["userId"] }),
  ]);

  const quizPassRate =
    totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const completionRate =
    enrolledStudents > 0
      ? Math.round((certificates.length / enrolledStudents) * 100)
      : 0;

  // Inactive 7d (enrolled but no activity in 7 days)
  const inactive7d = await prisma.user.count({
    where: {
      role: "STUDENT",
      enrolledAt: { not: null },
      OR: [
        { lastActivityAt: { lt: sevenDaysAgo } },
        { lastActivityAt: null },
      ],
    },
  });

  // Top drop-off module
  const dropOff = await prisma.moduleProgress.groupBy({
    by: ["moduleId"],
    where: { status: "UNLOCKED" },
    _count: true,
    orderBy: { _count: { moduleId: "desc" } },
    take: 1,
  });

  let topDropOffModule: string | null = null;
  if (dropOff.length > 0) {
    const mod = await prisma.module.findUnique({
      where: { id: dropOff[0].moduleId },
      select: { titleEn: true },
    });
    topDropOffModule = mod?.titleEn || null;
  }

  // Avg completion time (days)
  const certsWithEnrollment = await prisma.certificate.findMany({
    include: {
      user: { select: { enrolledAt: true } },
    },
  });
  let avgCompletionDays = 0;
  const validCerts = certsWithEnrollment.filter((c) => c.user.enrolledAt);
  if (validCerts.length > 0) {
    const totalDays = validCerts.reduce((sum, c) => {
      const days =
        (c.issuedAt.getTime() - c.user.enrolledAt!.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgCompletionDays = Math.round(totalDays / validCerts.length);
  }

  return {
    totalStudents,
    enrolledStudents,
    activeToday,
    active7d,
    inactive7d,
    quizPassRate,
    completionRate,
    avgQuizScore: Math.round(avgScore._avg.score || 0),
    revenue: revenue._sum.amountPaid || 0,
    topDropOffModule,
    avgCompletionDays,
  };
}

// ─── RISK ALERTS ────────────────────────────────────

export async function getRiskAlerts() {
  await requireAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Inactive students (7+ days)
  const inactive = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      enrolledAt: { not: null },
      OR: [
        { lastActivityAt: { lt: sevenDaysAgo } },
        { lastActivityAt: null },
      ],
    },
    select: { id: true, name: true, email: true, lastActivityAt: true },
    take: 10,
    orderBy: { lastActivityAt: { sort: "asc", nulls: "first" } },
  });

  // Quiz struggles (3+ fails on same quiz)
  const failedAttempts = await prisma.quizAttempt.groupBy({
    by: ["userId", "quizId"],
    where: { passed: false },
    _count: true,
    having: { quizId: { _count: { gte: 3 } } },
  });

  const struggleUserIds = [...new Set(failedAttempts.map((f) => f.userId))];
  const struggleUsers =
    struggleUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: struggleUserIds.slice(0, 10) } },
          select: { id: true, name: true, email: true },
        })
      : [];

  // Stuck modules (UNLOCKED 14+ days)
  const stuckProgress = await prisma.moduleProgress.findMany({
    where: {
      status: "UNLOCKED",
      updatedAt: { lt: fourteenDaysAgo },
      module: { isBonus: false },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      module: { select: { titleEn: true } },
    },
    take: 10,
    orderBy: { updatedAt: "asc" },
  });

  return {
    inactive: inactive.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      lastActivityAt: u.lastActivityAt?.toISOString() || null,
    })),
    quizStruggle: struggleUsers.map((u) => ({
      id: u.id,
      name: u.name || u.email,
    })),
    stuck: stuckProgress.map((sp) => ({
      userId: sp.user.id,
      name: sp.user.name || sp.user.email,
      moduleName: sp.module.titleEn,
    })),
  };
}

// ─── MODULE ANALYTICS ───────────────────────────────

export async function getModuleAnalytics() {
  await requireAdmin();

  const modules = await prisma.module.findMany({
    where: { isBonus: false },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { lessons: true } },
      moduleProgress: {
        select: { status: true, createdAt: true, updatedAt: true },
      },
    },
  });

  return modules.map((m) => {
    const started = m.moduleProgress.filter(
      (mp) => mp.status === "UNLOCKED" || mp.status === "COMPLETED"
    ).length;
    const completed = m.moduleProgress.filter(
      (mp) => mp.status === "COMPLETED"
    ).length;
    const completionRate =
      started > 0 ? Math.round((completed / started) * 100) : 0;
    const dropOffRate = started > 0 ? 100 - completionRate : 0;

    // Avg days to complete
    const completedEntries = m.moduleProgress.filter(
      (mp) => mp.status === "COMPLETED"
    );
    let avgDays = 0;
    if (completedEntries.length > 0) {
      const totalDays = completedEntries.reduce((sum, mp) => {
        const days =
          (mp.updatedAt.getTime() - mp.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgDays = Math.round(totalDays / completedEntries.length);
    }

    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    );
    const stuckCount = m.moduleProgress.filter(
      (mp) => mp.status === "UNLOCKED" && mp.updatedAt < fourteenDaysAgo
    ).length;

    return {
      id: m.id,
      titleEn: m.titleEn,
      titleEs: m.titleEs,
      order: m.order,
      totalLessons: m._count.lessons,
      started,
      completed,
      completionRate,
      dropOffRate,
      avgDays,
      stuckCount,
    };
  });
}

// ─── QUIZ ANALYTICS ─────────────────────────────────

export async function getQuizAnalytics() {
  await requireAdmin();

  const quizzes = await prisma.quiz.findMany({
    include: {
      module: { select: { titleEn: true, titleEs: true, order: true } },
      questions: {
        select: { id: true, questionEn: true, questionEs: true, correctOptionId: true },
      },
      attempts: {
        select: {
          userId: true,
          score: true,
          passed: true,
          answers: true,
        },
      },
    },
    orderBy: { module: { order: "asc" } },
  });

  return quizzes.map((q) => {
    const totalAttempts = q.attempts.length;
    const passedCount = q.attempts.filter((a) => a.passed).length;
    const passRate =
      totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            q.attempts.reduce((s, a) => s + a.score, 0) / totalAttempts
          )
        : 0;

    // Repeat failures (3+ failed attempts by same user)
    const failCounts: Record<string, number> = {};
    for (const a of q.attempts) {
      if (!a.passed) {
        failCounts[a.userId] = (failCounts[a.userId] || 0) + 1;
      }
    }
    const repeatFailures = Object.values(failCounts).filter(
      (c) => c >= 3
    ).length;

    // Per-question stats
    const questionStats = q.questions.map((question) => {
      let correctAnswers = 0;
      let totalAnswered = 0;

      for (const attempt of q.attempts) {
        const answers = attempt.answers as Array<{
          questionId: string;
          selectedOptionId: string;
          correct: boolean;
        }>;
        const answer = answers?.find(
          (a) => a.questionId === question.id
        );
        if (answer) {
          totalAnswered++;
          if (answer.correct) correctAnswers++;
        }
      }

      return {
        id: question.id,
        questionEn: question.questionEn,
        questionEs: question.questionEs,
        correctRate:
          totalAnswered > 0
            ? Math.round((correctAnswers / totalAnswered) * 100)
            : 0,
        totalAnswered,
      };
    });

    return {
      id: q.id,
      titleEn: q.titleEn,
      titleEs: q.titleEs,
      moduleTitleEn: q.module.titleEn,
      moduleTitleEs: q.module.titleEs,
      moduleOrder: q.module.order,
      totalAttempts,
      passRate,
      avgScore,
      repeatFailures,
      questionStats,
    };
  });
}

// ─── ACTIVITY FEED ──────────────────────────────────

export async function getActivityFeed(page = 1) {
  await requireAdmin();

  const pageSize = 20;
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  const [enrollments, moduleCompletions, quizAttempts, certs, auditLogs] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          enrolledAt: { gte: thirtyDaysAgo },
        },
        select: { id: true, name: true, email: true, enrolledAt: true },
        orderBy: { enrolledAt: "desc" },
        take: 50,
      }),
      prisma.moduleProgress.findMany({
        where: {
          status: "COMPLETED",
          updatedAt: { gte: thirtyDaysAgo },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          module: { select: { titleEn: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.quizAttempt.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          quiz: { select: { titleEn: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.certificate.findMany({
        where: { issuedAt: { gte: thirtyDaysAgo } },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: 50,
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        include: {
          admin: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  type FeedEvent = {
    type: "enrollment" | "module_complete" | "quiz_pass" | "quiz_fail" | "certificate" | "admin_action";
    userName: string;
    userId: string;
    detail: string;
    timestamp: string;
  };

  const events: FeedEvent[] = [];

  for (const e of enrollments) {
    events.push({
      type: "enrollment",
      userName: e.name || e.email,
      userId: e.id,
      detail: "Enrolled in course",
      timestamp: e.enrolledAt!.toISOString(),
    });
  }

  for (const mc of moduleCompletions) {
    events.push({
      type: "module_complete",
      userName: mc.user.name || mc.user.email,
      userId: mc.user.id,
      detail: mc.module.titleEn,
      timestamp: mc.updatedAt.toISOString(),
    });
  }

  for (const qa of quizAttempts) {
    events.push({
      type: qa.passed ? "quiz_pass" : "quiz_fail",
      userName: qa.user.name || qa.user.email,
      userId: qa.user.id,
      detail: `${qa.quiz.titleEn} — ${Math.round(qa.score)}%`,
      timestamp: qa.createdAt.toISOString(),
    });
  }

  for (const c of certs) {
    events.push({
      type: "certificate",
      userName: c.user.name || c.user.email,
      userId: c.user.id,
      detail: c.certificateCode,
      timestamp: c.issuedAt.toISOString(),
    });
  }

  for (const al of auditLogs) {
    events.push({
      type: "admin_action",
      userName: al.admin.name || al.admin.email,
      userId: al.adminId,
      detail: `${al.action} on ${al.targetType}`,
      timestamp: al.createdAt.toISOString(),
    });
  }

  events.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const start = (page - 1) * pageSize;
  return {
    events: events.slice(start, start + pageSize),
    total: events.length,
    totalPages: Math.ceil(events.length / pageSize),
    page,
  };
}

// ─── CERTIFICATES MANAGEMENT ────────────────────────

export async function getCertificateEligibility() {
  await requireAdmin();

  const course = await prisma.course.findFirst({
    where: { published: true },
    include: {
      modules: {
        where: { isBonus: false },
        include: { quiz: { select: { id: true } } },
      },
    },
  });
  if (!course) return [];

  const requiredModuleIds = course.modules.map((m) => m.id);
  const requiredQuizIds = course.modules
    .filter((m) => m.quiz)
    .map((m) => m.quiz!.id);

  // Get students who completed all modules
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      enrolledAt: { not: null },
      certificates: { none: { courseId: course.id } },
    },
    include: {
      moduleProgress: {
        where: {
          moduleId: { in: requiredModuleIds },
          status: "COMPLETED",
        },
      },
      quizAttempts: {
        where: {
          quizId: { in: requiredQuizIds },
          passed: true,
        },
        distinct: ["quizId"],
      },
    },
  });

  return students
    .filter(
      (s) =>
        s.moduleProgress.length >= requiredModuleIds.length &&
        s.quizAttempts.length >= requiredQuizIds.length
    )
    .map((s) => ({
      id: s.id,
      name: s.name || s.email,
      email: s.email,
      courseId: course.id,
    }));
}

export async function getCertificateHistory() {
  await requireAdmin();

  const certs = await prisma.certificate.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  return certs.map((c) => ({
    id: c.id,
    studentName: c.studentName,
    studentEmail: c.user.email,
    courseName: c.courseName,
    code: c.certificateCode,
    issuedAt: c.issuedAt.toISOString(),
  }));
}
