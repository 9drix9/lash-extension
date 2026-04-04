import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnhancedAdminStats, getRiskAlerts, getAdminBoard } from "@/lib/actions/admin-analytics";
import { AdminClient } from "./admin-client";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  // Ping lastActivityAt so online status works
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActivityAt: new Date() },
  });

  const [stats, alerts, adminBoard] = await Promise.all([
    getEnhancedAdminStats(),
    getRiskAlerts(),
    getAdminBoard(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("overview")}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t("previewCourseBtn")}
          </Link>
        </div>

        <AdminClient stats={stats} alerts={alerts} adminBoard={adminBoard} currentUserEmail={session.user.email} />
      </div>
    </div>
  );
}
