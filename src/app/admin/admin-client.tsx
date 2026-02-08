"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Users,
  BookOpen,
  HelpCircle,
  Video,
  UserCheck,
  BarChart3,
  Activity,
  Award,
  Shield,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalStudents: number;
  enrolledStudents: number;
  activeToday: number;
  active7d: number;
  inactive7d: number;
  quizPassRate: number;
  completionRate: number;
  avgQuizScore: number;
  revenue: number;
  topDropOffModule: string | null;
  avgCompletionDays: number;
}

interface RiskAlerts {
  inactive: { id: string; name: string; lastActivityAt: string | null }[];
  quizStruggle: { id: string; name: string }[];
  stuck: { userId: string; name: string; moduleName: string }[];
}

interface AdminClientProps {
  stats: Stats;
  alerts: RiskAlerts;
}

export function AdminClient({ stats, alerts }: AdminClientProps) {
  const t = useTranslations("admin");

  const totalAlerts =
    alerts.inactive.length + alerts.quizStruggle.length + alerts.stuck.length;

  const navLinks = [
    { href: "/admin/students", label: t("students"), description: t("studentsDesc"), icon: Users },
    { href: "/admin/modules", label: t("modules"), description: t("modulesDesc"), icon: BookOpen },
    { href: "/admin/quizzes", label: t("quizzes"), description: t("quizzesDesc"), icon: HelpCircle },
    { href: "/admin/live-sessions", label: t("liveSessions"), description: t("liveSessionsDesc"), icon: Video },
    { href: "/admin/affiliates", label: t("affiliates"), description: t("affiliatesDesc"), icon: UserCheck },
    { href: "/admin/analytics", label: t("analytics"), description: t("analyticsDesc"), icon: BarChart3 },
    { href: "/admin/activity", label: t("activityFeed"), description: t("activityDesc"), icon: Activity },
    { href: "/admin/certificates", label: t("certificates"), description: t("certificatesDesc"), icon: Award },
    { href: "/admin/audit", label: t("auditLog"), description: t("auditDesc"), icon: Shield },
  ];

  return (
    <>
      {/* Stats Grid — Row 1 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("activeToday")}
          value={stats.activeToday}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          sub={`${stats.active7d} ${t("active7d")}`}
        />
        <StatCard
          label={t("totalEnrolled")}
          value={stats.enrolledStudents}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          sub={`${stats.totalStudents} total`}
        />
        <StatCard
          label={t("revenue")}
          value={`$${(stats.revenue / 100).toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          label={t("completionRate")}
          value={`${stats.completionRate}%`}
          icon={<Award className="h-4 w-4 text-gold" />}
          sub={`${t("avgQuizScore")}: ${stats.avgQuizScore}%`}
        />
      </div>

      {/* Stats Grid — Row 2 */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("inactive7d")}
          value={stats.inactive7d}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          variant={stats.inactive7d > 0 ? "warning" : undefined}
        />
        <StatCard
          label={t("quizPassRate")}
          value={`${stats.quizPassRate}%`}
          icon={<HelpCircle className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label={t("avgCompletionDays")}
          value={stats.avgCompletionDays > 0 ? t("days", { count: stats.avgCompletionDays }) : "--"}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label={t("topDropOff")}
          value={stats.topDropOffModule || "--"}
          icon={<BarChart3 className="h-4 w-4 text-red-500" />}
          small
        />
      </div>

      {/* Risk Alerts */}
      {totalAlerts > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("riskAlerts")}
            <Badge variant="destructive" className="ml-1">
              {totalAlerts}
            </Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.inactive.length > 0 && (
              <AlertCard
                title={t("inactiveStudents")}
                count={alerts.inactive.length}
                items={alerts.inactive.map((u) => ({
                  id: u.id,
                  label: u.name,
                  sub: u.lastActivityAt
                    ? daysSince(u.lastActivityAt) + "d ago"
                    : t("neverActive"),
                }))}
              />
            )}
            {alerts.quizStruggle.length > 0 && (
              <AlertCard
                title={t("quizStruggles")}
                count={alerts.quizStruggle.length}
                items={alerts.quizStruggle.map((u) => ({
                  id: u.id,
                  label: u.name,
                  sub: "3+ failed attempts",
                }))}
              />
            )}
            {alerts.stuck.length > 0 && (
              <AlertCard
                title={t("stuckModules")}
                count={alerts.stuck.length}
                items={alerts.stuck.map((u) => ({
                  id: u.userId,
                  label: u.name,
                  sub: u.moduleName,
                }))}
              />
            )}
          </div>
        </div>
      )}

      {/* Navigation Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("manage")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  {link.label}
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  {t("manage")} <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

// ─── Helper Components ──────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
  variant,
  small,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  variant?: "warning";
  small?: boolean;
}) {
  return (
    <Card className={variant === "warning" ? "border-amber-200 bg-amber-50/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={small ? "text-lg font-bold truncate" : "text-3xl font-bold"}>
          {value}
        </div>
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: { id: string; label: string; sub: string }[];
}) {
  const t = useTranslations("admin");
  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          {title}
          <Badge variant="outline">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {item.sub}
              </span>
            </div>
            <Link
              href={`/admin/students/${item.id}`}
              className="text-xs text-primary hover:underline"
            >
              {t("viewProfile")}
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
