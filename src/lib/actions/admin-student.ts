"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "./admin-audit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

// ─── ENHANCED STUDENT LIST ──────────────────────────

export async function getStudentsEnhanced() {
  await requireAdmin();

  const course = await prisma.course.findFirst({
    where: { published: true },
    include: {
      modules: { where: { isBonus: false }, select: { id: true } },
    },
  });
  const totalRequired = course?.modules.length || 0;

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      _count: {
        select: { quizAttempts: true, certificates: true },
      },
      moduleProgress: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      quizAttempts: {
        where: { passed: false },
        select: { quizId: true, userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return students.map((s) => {
    const completedModules = s.moduleProgress.filter(
      (mp) => mp.status === "COMPLETED"
    ).length;
    const currentModule = s.moduleProgress.find(
      (mp) => mp.status === "UNLOCKED"
    );
    const progressPercent =
      totalRequired > 0
        ? Math.round((completedModules / totalRequired) * 100)
        : 0;

    // Count failed attempts per quiz
    const failCounts: Record<string, number> = {};
    for (const a of s.quizAttempts) {
      failCounts[a.quizId] = (failCounts[a.quizId] || 0) + 1;
    }
    const quizStruggle = Object.values(failCounts).some((c) => c >= 3);

    const inactive =
      s.enrolledAt &&
      (!s.lastActivityAt || s.lastActivityAt < sevenDaysAgo);
    const stuck = s.moduleProgress.some(
      (mp) =>
        mp.status === "UNLOCKED" && mp.updatedAt < fourteenDaysAgo
    );

    let riskFlag: "active" | "inactive" | "at_risk" = "active";
    if (quizStruggle || stuck) riskFlag = "at_risk";
    else if (inactive) riskFlag = "inactive";

    return {
      id: s.id,
      name: s.name || "No name",
      email: s.email,
      enrolledAt: s.enrolledAt?.toISOString() || null,
      lastActivityAt: s.lastActivityAt?.toISOString() || null,
      completedModules,
      totalRequired,
      progressPercent,
      currentModuleId: currentModule?.moduleId || null,
      quizAttempts: s._count.quizAttempts,
      certificates: s._count.certificates,
      paymentStatus: s.payments[0]?.status || null,
      riskFlag,
    };
  });
}

// ─── STUDENT PROFILE ────────────────────────────────

export async function getStudentProfile(studentId: string) {
  await requireAdmin();

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      moduleProgress: {
        include: { module: { select: { titleEn: true, titleEs: true, order: true, isBonus: true } } },
        orderBy: { module: { order: "asc" } },
      },
      certificates: true,
      _count: { select: { quizAttempts: true } },
    },
  });

  if (!student) throw new Error("Student not found");

  return {
    id: student.id,
    name: student.name || "No name",
    email: student.email,
    image: student.image,
    enrolledAt: student.enrolledAt?.toISOString() || null,
    lastActivityAt: student.lastActivityAt?.toISOString() || null,
    createdAt: student.createdAt.toISOString(),
    paymentStatus: student.payments[0]?.status || null,
    paymentType: student.payments[0]?.paymentType || null,
    amountPaid: student.payments[0]?.amountPaid || 0,
    moduleProgress: student.moduleProgress.map((mp) => ({
      moduleId: mp.moduleId,
      titleEn: mp.module.titleEn,
      titleEs: mp.module.titleEs,
      order: mp.module.order,
      isBonus: mp.module.isBonus,
      status: mp.status,
    })),
    certificates: student.certificates.map((c) => ({
      code: c.certificateCode,
      issuedAt: c.issuedAt.toISOString(),
    })),
    totalQuizAttempts: student._count.quizAttempts,
  };
}

export async function getStudentTimeline(studentId: string) {
  await requireAdmin();

  const [lessonCompletions, moduleCompletions, quizAttempts, certificates] =
    await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId: studentId, completed: true },
        include: {
          lesson: {
            select: {
              titleEn: true,
              titleEs: true,
              module: { select: { titleEn: true, titleEs: true } },
            },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 50,
      }),
      prisma.moduleProgress.findMany({
        where: { userId: studentId, status: "COMPLETED" },
        include: {
          module: { select: { titleEn: true, titleEs: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: studentId },
        include: {
          quiz: {
            select: {
              titleEn: true,
              titleEs: true,
              module: { select: { titleEn: true, titleEs: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.certificate.findMany({
        where: { userId: studentId },
        orderBy: { issuedAt: "desc" },
      }),
    ]);

  type TimelineEvent = {
    type: "lesson" | "module" | "quiz_pass" | "quiz_fail" | "certificate";
    titleEn: string;
    titleEs: string;
    detail?: string;
    timestamp: string;
  };

  const events: TimelineEvent[] = [];

  for (const lp of lessonCompletions) {
    events.push({
      type: "lesson",
      titleEn: lp.lesson.titleEn,
      titleEs: lp.lesson.titleEs,
      detail: lp.lesson.module.titleEn,
      timestamp: (lp.completedAt || lp.updatedAt).toISOString(),
    });
  }

  for (const mp of moduleCompletions) {
    events.push({
      type: "module",
      titleEn: mp.module.titleEn,
      titleEs: mp.module.titleEs,
      timestamp: mp.updatedAt.toISOString(),
    });
  }

  for (const qa of quizAttempts) {
    events.push({
      type: qa.passed ? "quiz_pass" : "quiz_fail",
      titleEn: qa.quiz.titleEn,
      titleEs: qa.quiz.titleEs,
      detail: `Score: ${Math.round(qa.score)}% (Attempt #${qa.attemptNumber})`,
      timestamp: qa.createdAt.toISOString(),
    });
  }

  for (const cert of certificates) {
    events.push({
      type: "certificate",
      titleEn: cert.courseName,
      titleEs: cert.courseName,
      detail: cert.certificateCode,
      timestamp: cert.issuedAt.toISOString(),
    });
  }

  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return events.slice(0, 100);
}

export async function getStudentNotes(studentId: string) {
  await requireAdmin();

  const notes = await prisma.adminNote.findMany({
    where: { studentId },
    include: {
      admin: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((n) => ({
    id: n.id,
    adminName: n.admin.name || n.admin.email,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ─── ADMIN ACTIONS ──────────────────────────────────

export async function addAdminNote(studentId: string, content: string) {
  const session = await requireAdmin();

  const note = await prisma.adminNote.create({
    data: {
      adminId: session.user.id,
      studentId,
      content,
    },
  });

  await logAuditEvent(
    session.user.id,
    "ADD_NOTE",
    "USER",
    studentId,
    { noteId: note.id }
  );

  revalidatePath(`/admin/students/${studentId}`);
}

export async function deleteAdminNote(noteId: string) {
  const session = await requireAdmin();

  const note = await prisma.adminNote.findUnique({
    where: { id: noteId },
  });
  if (!note) throw new Error("Note not found");

  await prisma.adminNote.delete({ where: { id: noteId } });

  await logAuditEvent(
    session.user.id,
    "DELETE_NOTE",
    "USER",
    note.studentId,
    { noteId }
  );

  revalidatePath(`/admin/students/${note.studentId}`);
}

export async function resetStudentQuiz(studentId: string, quizId: string) {
  const session = await requireAdmin();

  await prisma.quizAttempt.deleteMany({
    where: { userId: studentId, quizId },
  });

  await logAuditEvent(
    session.user.id,
    "RESET_QUIZ",
    "USER",
    studentId,
    { quizId }
  );

  revalidatePath(`/admin/students/${studentId}`);
}

export async function unlockModuleForStudent(
  studentId: string,
  moduleId: string
) {
  const session = await requireAdmin();

  await prisma.moduleProgress.upsert({
    where: {
      userId_moduleId: { userId: studentId, moduleId },
    },
    update: { status: "UNLOCKED" },
    create: { userId: studentId, moduleId, status: "UNLOCKED" },
  });

  await logAuditEvent(
    session.user.id,
    "UNLOCK_MODULE",
    "MODULE",
    moduleId,
    { studentId }
  );

  revalidatePath(`/admin/students/${studentId}`);
}

export async function grantCertificate(studentId: string, courseId: string) {
  const session = await requireAdmin();

  const [student, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!student || !course) throw new Error("Not found");

  const existing = await prisma.certificate.findFirst({
    where: { userId: studentId, courseId },
  });
  if (existing) throw new Error("Certificate already exists");

  const code = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const cert = await prisma.certificate.create({
    data: {
      userId: studentId,
      courseId,
      certificateCode: code,
      studentName: student.name || student.email,
      courseName: course.titleEn,
    },
  });

  await logAuditEvent(
    session.user.id,
    "GRANT_CERTIFICATE",
    "CERTIFICATE",
    cert.id,
    { studentId, courseId }
  );

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/certificates");

  return cert;
}
