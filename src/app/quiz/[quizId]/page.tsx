import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
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
        locale={session.user.locale || "en"}
      />
    );
  } catch {
    redirect("/dashboard");
  }
}
