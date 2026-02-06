"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unlockNextModule } from "./progress";
import { revalidatePath } from "next/cache";

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

export async function submitQuiz(quizId: string, answers: QuizAnswer[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz) throw new Error("Quiz not found");

  // Check module is unlocked for this user
  const moduleProgress = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: {
        userId: session.user.id,
        moduleId: quiz.moduleId,
      },
    },
  });

  if (!moduleProgress || moduleProgress.status === "LOCKED") {
    throw new Error("Module is locked");
  }

  // Calculate score
  const results = answers.map((answer) => {
    const question = quiz.questions.find((q) => q.id === answer.questionId);
    const correct = question
      ? question.correctOptionId === answer.selectedOptionId
      : false;
    return {
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      correct,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const totalQuestions = quiz.questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  const passingScore = quiz.passingScore ?? quiz.module.course.passingScore;
  const passed = score >= passingScore;

  // Get attempt number
  const prevAttempts = await prisma.quizAttempt.count({
    where: {
      userId: session.user.id,
      quizId,
    },
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score: Math.round(score * 100) / 100,
      passed,
      attemptNumber: prevAttempts + 1,
      answers: results,
    },
  });

  // If passed, unlock next module
  if (passed) {
    await unlockNextModule(session.user.id, quiz.moduleId);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/quiz/${quizId}`);

  return {
    attemptId: attempt.id,
    score: Math.round(score * 100) / 100,
    passed,
    passingScore,
    correctCount,
    totalQuestions,
    results,
  };
}

export async function getQuizForStudent(quizId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz) throw new Error("Quiz not found");

  // Check module access
  const moduleProgress = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: {
        userId: session.user.id,
        moduleId: quiz.moduleId,
      },
    },
  });

  if (!moduleProgress || moduleProgress.status === "LOCKED") {
    throw new Error("Module is locked");
  }

  // Get previous attempts
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      quizId,
    },
    orderBy: { createdAt: "desc" },
  });

  const hasPassed = attempts.some((a) => a.passed);
  const passingScore = quiz.passingScore ?? quiz.module.course.passingScore;

  // Prepare questions - strip correct answers if not passed
  const questions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    questionEn: q.questionEn,
    questionEs: q.questionEs,
    scenarioEn: q.scenarioEn,
    scenarioEs: q.scenarioEs,
    options: q.options,
    order: q.order,
    // Only include correct answer and explanation if student has passed
    ...(hasPassed
      ? {
          correctOptionId: q.correctOptionId,
          explanationEn: q.explanationEn,
          explanationEs: q.explanationEs,
        }
      : {}),
  }));

  return {
    quiz: {
      id: quiz.id,
      titleEn: quiz.titleEn,
      titleEs: quiz.titleEs,
      descEn: quiz.descEn,
      descEs: quiz.descEs,
      moduleId: quiz.moduleId,
      moduleTitleEn: quiz.module.titleEn,
      moduleTitleEs: quiz.module.titleEs,
    },
    questions,
    attempts,
    hasPassed,
    passingScore,
    attemptCount: attempts.length,
  };
}
