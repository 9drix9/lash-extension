import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModulesClient } from "./modules-client";

export default async function ModulesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { lessons: true },
      },
      quiz: {
        select: { id: true },
      },
    },
  });

  const modulesData = modules.map((mod) => ({
    id: mod.id,
    titleEn: mod.titleEn,
    titleEs: mod.titleEs,
    subtitleEn: mod.subtitleEn,
    subtitleEs: mod.subtitleEs,
    descEn: mod.descEn,
    descEs: mod.descEs,
    imageUrl: mod.imageUrl,
    order: mod.order,
    isBonus: mod.isBonus,
    lessonCount: mod._count.lessons,
    hasQuiz: !!mod.quiz,
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
          <h1 className="text-3xl font-bold tracking-tight">{t("modules")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("modulesTotal", { count: modulesData.length })}
          </p>
        </div>

        <ModulesClient modules={modulesData} />
      </div>
    </div>
  );
}
