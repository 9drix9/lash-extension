import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getEnhancedAdminStats, getRiskAlerts } from "@/lib/actions/admin-analytics";
import { AdminClient } from "./admin-client";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const [stats, alerts] = await Promise.all([
    getEnhancedAdminStats(),
    getRiskAlerts(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("overview")}</p>
        </div>

        <AdminClient stats={stats} alerts={alerts} />
      </div>
    </div>
  );
}
