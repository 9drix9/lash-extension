import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getModuleAnalytics, getQuizAnalytics } from "@/lib/actions/admin-analytics";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const [moduleData, quizData] = await Promise.all([
    getModuleAnalytics(),
    getQuizAnalytics(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("backToAdmin")}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("analytics")}</h1>
          <p className="mt-1 text-muted-foreground">{t("analyticsDesc")}</p>
        </div>

        <AnalyticsClient moduleData={moduleData} quizData={quizData} />
      </div>
    </div>
  );
}
