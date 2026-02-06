import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminStats } from "@/lib/actions/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const stats = await getAdminStats();

  const navLinks = [
    { href: "/admin/students", label: t("students"), description: "View and manage student accounts" },
    { href: "/admin/modules", label: t("modules"), description: "Edit module content and settings" },
    { href: "/admin/quizzes", label: t("quizzes"), description: "Manage quiz questions and scoring" },
    { href: "/admin/live-sessions", label: t("liveSessions"), description: "Schedule and manage live Q&A" },
    { href: "/admin/affiliates", label: t("affiliates"), description: "Review affiliate applications and payouts" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("overview")}</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("totalStudents")}</CardDescription>
              <CardTitle className="text-4xl">{stats.totalStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.totalAttempts} quiz attempts total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("totalEnrolled")}</CardDescription>
              <CardTitle className="text-4xl">{stats.enrolledStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.passedAttempts} passed attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("completionRate")}</CardDescription>
              <CardTitle className="text-4xl">{stats.completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("avgQuizScore")}</CardDescription>
              <CardTitle className="text-4xl">{stats.avgQuizScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Across all quiz attempts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Links */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("manage")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{link.label}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm font-medium text-primary">
                    {t("manage")} &rarr;
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
