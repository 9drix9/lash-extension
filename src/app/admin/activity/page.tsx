import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActivityFeed } from "@/lib/actions/admin-analytics";
import { ActivityClient } from "./activity-client";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const feed = await getActivityFeed(1);

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
          <h1 className="text-3xl font-bold tracking-tight">{t("activityFeed")}</h1>
          <p className="mt-1 text-muted-foreground">{t("activityDesc")}</p>
        </div>

        <ActivityClient initialFeed={feed} />
      </div>
    </div>
  );
}
