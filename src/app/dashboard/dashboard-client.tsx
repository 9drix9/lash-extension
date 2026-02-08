"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Award,
  BookOpen,
  ChevronRight,
  Download,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleGrid } from "@/components/module-grid";
import { ProgressBar } from "@/components/progress-bar";
import { generateStudentCertificate } from "@/lib/actions/certificate";
import { useState } from "react";
import { toast } from "sonner";

import { QuickActions } from "./quick-actions";
import { CourseRoadmap } from "./course-roadmap";
import { CertificateProgress } from "./certificate-progress";
import { ResourcesVault } from "./resources-vault";
import { EnhancedMilestones } from "./enhanced-milestones";

interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  order: number;
  isBonus: boolean;
  status: "LOCKED" | "UNLOCKED" | "COMPLETED";
  quizPassed: boolean;
  quizId: string | null;
  bestScore: number | null;
  totalLessons: number;
  completedLessons: number;
}

interface MilestoneData {
  id: string;
  title: string;
  message: string;
  badgeEmoji: string;
  nextStep: string;
  awardedAt: string;
}

interface AllMilestoneData {
  id: string;
  triggerType: string;
  title: string;
  badgeEmoji: string;
  earned: boolean;
}

interface Props {
  userName: string;
  modules: ModuleData[];
  progressPercent: number;
  completedCount: number;
  totalRequired: number;
  nextModule: ModuleData | null;
  milestones: MilestoneData[];
  certificate: { code: string; pdfUrl: string | null } | null;
  courseId: string;
  allComplete: boolean;
  resumeLesson: { moduleId: string; lessonId: string } | null;
  lastFailedQuizId: string | null;
  quizzesRequired: number;
  quizzesPassed: number;
  allMilestones: AllMilestoneData[];
}

export function DashboardClient({
  userName,
  modules,
  progressPercent,
  completedCount,
  totalRequired,
  nextModule,
  milestones,
  certificate,
  courseId,
  allComplete,
  resumeLesson,
  lastFailedQuizId,
  quizzesRequired,
  quizzesPassed,
  allMilestones,
}: Props) {
  const t = useTranslations("dashboard");
  const [generating, setGenerating] = useState(false);

  const handleGetCertificate = async () => {
    setGenerating(true);
    try {
      const cert = await generateStudentCertificate(courseId);
      if (cert?.pdfUrl) {
        const link = document.createElement("a");
        link.href = cert.pdfUrl;
        link.download = `certificate-${cert.certificateCode}.pdf`;
        link.click();
      }
      toast.success(t("certificateGenerated"));
    } catch {
      toast.error(t("certificateError"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("welcome")}, {userName}
          </p>
        </div>

        {/* 2. Progress + Next Action Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("progress")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar
                value={progressPercent}
                showPercentage
                label={t("moduleProgress", {
                  completed: completedCount,
                  total: totalRequired,
                })}
              />
            </CardContent>
          </Card>

          {/* Next Action Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t("nextAction")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allComplete ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("allComplete")}
                  </p>
                  {certificate ? (
                    <Link href={`/certificate/${certificate.code}/verify`}>
                      <Button size="sm" className="w-full">
                        <Award className="w-4 h-4 mr-2" />
                        {t("viewCertificate")}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleGetCertificate}
                      disabled={generating}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {generating ? "..." : t("getCertificate")}
                    </Button>
                  )}
                </div>
              ) : nextModule ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {nextModule.completedLessons > 0
                      ? t("continueModule")
                      : t("startModule")}
                  </p>
                  <p className="font-medium mb-3">{nextModule.title}</p>
                  <Link href={`/module/${nextModule.id}`}>
                    <Button size="sm" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {nextModule.completedLessons > 0
                        ? t("continueModule")
                        : t("startModule")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("completePrevious")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. Quick Actions */}
        <div className="mb-8">
          <QuickActions
            resumeLesson={resumeLesson}
            lastFailedQuizId={lastFailedQuizId}
          />
        </div>

        {/* 4. Course Roadmap */}
        <div className="mb-8">
          <CourseRoadmap modules={modules} />
        </div>

        {/* 5. Certificate Progress + Enhanced Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CertificateProgress
            completedCount={completedCount}
            totalRequired={totalRequired}
            quizzesPassed={quizzesPassed}
            quizzesRequired={quizzesRequired}
            allComplete={allComplete}
            certificate={certificate}
            courseId={courseId}
            onGetCertificate={handleGetCertificate}
            generating={generating}
          />
          <EnhancedMilestones
            earnedMilestones={milestones}
            allMilestones={allMilestones}
          />
        </div>

        {/* 6. Resources Vault */}
        <div className="mb-8">
          <ResourcesVault />
        </div>

        {/* 7. Module Grid */}
        <div>
          <ModuleGrid modules={modules} />
        </div>
      </div>
    </div>
  );
}
