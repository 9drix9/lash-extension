import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActivePayment } from "@/lib/actions/payment";
import { getQuizForStudent } from "@/lib/actions/quiz";
import { QuizClient } from "./quiz-client";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "es" ? "es" : "en";

  // Check payment
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { module: true },
  });
  if (quiz) {
    const paid = await hasActivePayment(session.user.id, quiz.module.courseId);
    if (!paid) redirect("/enroll");
  }

  try {
    const data = await getQuizForStudent(quizId);
    return (
      <QuizClient
        quiz={data.quiz}
        questions={data.questions as unknown as import("./quiz-client").QuizQuestion[]}
        attempts={data.attempts.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          answers: a.answers as { questionId: string; selectedOptionId: string; correct: boolean }[],
        }))}
        hasPassed={data.hasPassed}
        passingScore={data.passingScore}
        attemptCount={data.attemptCount}
        locale={locale}
      />
    );
  } catch {
    redirect("/dashboard");
  }
}
