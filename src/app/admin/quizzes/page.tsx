import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuizzesClient } from "./quizzes-client";

export default async function QuizzesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const course = await prisma.course.findFirst({
    where: { published: true },
    select: { id: true, passingScore: true },
  });

  const quizzes = await prisma.quiz.findMany({
    orderBy: { module: { order: "asc" } },
    include: {
      module: {
        select: { titleEn: true, order: true },
      },
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  const quizzesData = quizzes.map((quiz) => ({
    id: quiz.id,
    titleEn: quiz.titleEn,
    titleEs: quiz.titleEs,
    moduleName: quiz.module.titleEn,
    moduleOrder: quiz.module.order,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type as "MCQ" | "SCENARIO",
      questionEn: q.questionEn,
      questionEs: q.questionEs,
      scenarioEn: q.scenarioEn,
      scenarioEs: q.scenarioEs,
      options: q.options as { id: string; textEn: string; textEs: string }[],
      correctOptionId: q.correctOptionId,
      explanationEn: q.explanationEn,
      explanationEs: q.explanationEs,
      order: q.order,
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("title")}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("quizzes")}</h1>
          <p className="mt-1 text-muted-foreground">
            {quizzesData.length} quizzes total
          </p>
        </div>

        <QuizzesClient
          quizzes={quizzesData}
          courseId={course?.id || ""}
          globalPassingScore={course?.passingScore || 80}
        />
      </div>
    </div>
  );
}
