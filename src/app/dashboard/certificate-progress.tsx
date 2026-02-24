"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Award, CheckCircle2, Circle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CertificateProgressProps {
  completedCount: number;
  totalRequired: number;
  quizzesPassed: number;
  quizzesRequired: number;
  allComplete: boolean;
  certificate: { code: string; pdfUrl: string | null } | null;
  courseId: string;
  onGetCertificate: () => void;
  generating: boolean;
}

export function CertificateProgress({
  completedCount,
  totalRequired,
  quizzesPassed,
  quizzesRequired,
  allComplete,
  certificate,
  onGetCertificate,
  generating,
}: CertificateProgressProps) {
  const t = useTranslations("dashboard");

  const totalReqs = totalRequired + quizzesRequired;
  const totalDone = completedCount + quizzesPassed;
  const percent = totalReqs > 0 ? Math.round((totalDone / totalReqs) * 100) : 0;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const modulesComplete = completedCount >= totalRequired;
  const quizzesComplete = quizzesPassed >= quizzesRequired;
  const remaining =
    (modulesComplete ? 0 : 1) + (quizzesComplete ? 0 : 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {t("certificationProgress")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* SVG Progress Ring */}
        <div className="relative h-28 w-28">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(0 0% 90%)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {percent}%
            </span>
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="w-full space-y-2">
          <div className="flex items-start gap-2">
            {modulesComplete ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{t("completeModules")}</p>
              <p className="text-xs text-muted-foreground">
                {t("modulesCompleted", {
                  completed: completedCount,
                  total: totalRequired,
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            {quizzesComplete ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{t("passQuizzes")}</p>
              <p className="text-xs text-muted-foreground">
                {t("quizzesPassedLabel", {
                  passed: quizzesPassed,
                  total: quizzesRequired,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="w-full">
          {allComplete && certificate ? (
            <Link href={`/certificate/${certificate.code}/verify`}>
              <Button size="sm" className="w-full">
                <Award className="h-4 w-4 mr-2" />
                {t("viewCertificate")}
              </Button>
            </Link>
          ) : allComplete ? (
            <Button
              size="sm"
              className="w-full"
              onClick={onGetCertificate}
              disabled={generating}
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "..." : t("getCertificate")}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {remaining > 0
                ? t("itemsRemaining", { count: remaining })
                : t("readyForCertificate")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
