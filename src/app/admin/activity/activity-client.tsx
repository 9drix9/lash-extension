"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  UserPlus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActivityFeed } from "@/lib/actions/admin-analytics";

interface FeedEvent {
  type:
    | "enrollment"
    | "module_complete"
    | "quiz_pass"
    | "quiz_fail"
    | "certificate"
    | "admin_action";
  userName: string;
  userId: string;
  detail: string;
  timestamp: string;
}

interface Feed {
  events: FeedEvent[];
  total: number;
  totalPages: number;
  page: number;
}

interface Props {
  initialFeed: Feed;
}

const eventIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  enrollment: { icon: <UserPlus className="h-4 w-4" />, color: "text-blue-500 bg-blue-50" },
  module_complete: { icon: <BookOpen className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
  quiz_pass: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
  quiz_fail: { icon: <XCircle className="h-4 w-4" />, color: "text-red-500 bg-red-50" },
  certificate: { icon: <Award className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
  admin_action: { icon: <Shield className="h-4 w-4" />, color: "text-purple-600 bg-purple-50" },
};

export function ActivityClient({ initialFeed }: Props) {
  const t = useTranslations("admin");

  const eventLabels: Record<string, string> = {
    enrollment: t("eventEnrolled"),
    module_complete: t("eventModuleComplete"),
    quiz_pass: t("eventQuizPassed"),
    quiz_fail: t("eventQuizFailed"),
    certificate: t("eventCertificate"),
    admin_action: t("eventAdmin"),
  };
  const [feed, setFeed] = useState(initialFeed);
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  function loadPage(page: number) {
    startTransition(async () => {
      const data = await getActivityFeed(page);
      setFeed(data);
    });
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t("minutesAgo", { count: Math.floor(diff / (1000 * 60)) });
    if (hours < 24) return t("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("daysAgo", { count: days });
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const filteredEvents =
    filter === "all"
      ? feed.events
      : feed.events.filter((e) => e.type === filter);

  const filters = [
    { key: "all", label: t("filterAll") },
    { key: "enrollment", label: t("filterEnrollments") },
    { key: "module_complete", label: t("filterModulesLabel") },
    { key: "quiz_pass", label: t("filterPassed") },
    { key: "quiz_fail", label: t("filterFailed") },
    { key: "certificate", label: t("filterCertificates") },
    { key: "admin_action", label: t("filterAdminLabel") },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Feed */}
      <Card>
        <CardContent className="divide-y p-0">
          {filteredEvents.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t("noEvents")}
            </div>
          ) : (
            filteredEvents.map((event, i) => {
              const config = eventIcons[event.type] || eventIcons.enrollment;
              return (
                <div
                  key={`${event.timestamp}-${i}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.color}`}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/students/${event.userId}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {event.userName}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {eventLabels[event.type] || event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {event.detail}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {feed.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={feed.page <= 1 || isPending}
            onClick={() => loadPage(feed.page - 1)}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pageOf", { page: feed.page, total: feed.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={feed.page >= feed.totalPages || isPending}
            onClick={() => loadPage(feed.page + 1)}
          >
            {t("nextPage")}
          </Button>
        </div>
      )}
    </div>
  );
}
