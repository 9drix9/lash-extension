"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Play, RotateCcw, Download, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  resumeLesson: { moduleId: string; lessonId: string } | null;
  lastFailedQuizId: string | null;
}

export function QuickActions({
  resumeLesson,
  lastFailedQuizId,
}: QuickActionsProps) {
  const t = useTranslations("dashboard");

  const actions = [
    {
      key: "resume",
      icon: Play,
      label: t("resumeLesson"),
      href: resumeLesson ? `/module/${resumeLesson.moduleId}` : null,
      disabled: !resumeLesson,
    },
    {
      key: "retake",
      icon: RotateCcw,
      label: t("retakeLastQuiz"),
      href: lastFailedQuizId ? `/quiz/${lastFailedQuizId}` : null,
      disabled: !lastFailedQuizId,
    },
    {
      key: "resources",
      icon: Download,
      label: t("downloadResources"),
      href: "#resources-vault",
      disabled: false,
    },
    {
      key: "ask",
      icon: MessageCircle,
      label: t("askInstructor"),
      href: "/live",
      disabled: false,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{t("quickActions")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const content = (
            <Card
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 text-center transition-colors",
                action.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-gold/50 hover:bg-gold/5 cursor-pointer"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                <action.icon className="h-5 w-5 text-gold" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Card>
          );

          if (action.disabled || !action.href) {
            return <div key={action.key}>{content}</div>;
          }

          return (
            <Link key={action.key} href={action.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
