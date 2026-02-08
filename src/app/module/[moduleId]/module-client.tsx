"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/video-player";
import { markLessonComplete } from "@/lib/actions/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonData {
  id: string;
  title: string;
  content: string;
  order: number;
  videoProvider: string | null;
  videoUrl: string | null;
  videoPoster: string | null;
  downloadUrl: string | null;
  downloadLabel: string | null;
  completed: boolean;
  watchedPercent: number;
}

interface Props {
  moduleId: string;
  moduleTitle: string;
  moduleDesc: string;
  moduleOrder: number;
  isBonus: boolean;
  lessons: LessonData[];
  quizId: string | null;
  quizPassed: boolean;
  allLessonsComplete: boolean;
  status: string;
}

export function ModuleClient({
  moduleTitle,
  moduleOrder,
  isBonus,
  lessons,
  quizId,
  quizPassed,
  allLessonsComplete,
  status,
}: Props) {
  const t = useTranslations("module");
  const [activeLesson, setActiveLesson] = useState(0);
  const [lessonStates, setLessonStates] = useState(
    lessons.map((l) => ({ ...l }))
  );

  const currentLesson = lessonStates[activeLesson];

  const handleLessonSelect = (index: number) => {
    setActiveLesson(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkComplete = async () => {
    try {
      await markLessonComplete(currentLesson.id);
      setLessonStates((prev) =>
        prev.map((l, i) =>
          i === activeLesson ? { ...l, completed: true } : l
        )
      );
      toast.success(t("completed"));
    } catch {
      toast.error(t("markCompleteError"));
    }
  };

  const completedCount = lessonStates.filter((l) => l.completed).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("backToDashboard")}
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {isBonus ? t("bonus") : `${t("title")} ${moduleOrder}`}
              </Badge>
              {status === "COMPLETED" && (
                <Badge className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  {t("completed")}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold mt-1">
              {moduleTitle}
            </h1>
          </div>
        </div>

        {/* Mobile Lesson Selector */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-sm">{t("lessons")}</h3>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{lessons.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lessonStates.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonSelect(index)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                  activeLesson === index
                    ? "bg-primary text-primary-foreground border-primary"
                    : lesson.completed
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-white text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {lesson.completed && (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                )}
                {lesson.order}
              </button>
            ))}
            {quizId && (
              <Link
                href={`/quiz/${quizId}`}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                  quizPassed
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                )}
              >
                <FileText className="w-3 h-3" />
                {t("quiz")}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson Sidebar - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1">{t("lessons")}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("progress")}: {completedCount}/{lessons.length}
                </p>
                <div className="space-y-1">
                  {lessonStates.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonSelect(index)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2",
                        activeLesson === index
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {lesson.order}. {lesson.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quiz Link */}
                {quizId && (
                  <>
                    <Separator className="my-3" />
                    <Link href={`/quiz/${quizId}`}>
                      <button
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2",
                          quizPassed
                            ? "bg-green-50 text-green-800"
                            : "bg-primary/5 text-primary hover:bg-primary/10"
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span>{t("quiz")}</span>
                        {quizPassed && (
                          <Check className="w-4 h-4 ml-auto text-green-600" />
                        )}
                      </button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Lesson Title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("lesson")} {currentLesson.order}
                    </p>
                    <h2 className="text-xl font-semibold">
                      {currentLesson.title}
                    </h2>
                  </div>
                  {currentLesson.completed ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      {t("completed")}
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={handleMarkComplete}>
                      <Check className="w-4 h-4 mr-1" />
                      {t("markComplete")}
                    </Button>
                  )}
                </div>

                {/* Video */}
                {currentLesson.videoUrl && (
                  <div className="mb-6">
                    <VideoPlayer
                      provider={currentLesson.videoProvider || "youtube"}
                      url={currentLesson.videoUrl}
                      poster={currentLesson.videoPoster || undefined}
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />

                {/* Download */}
                {currentLesson.downloadUrl && (
                  <div className="mt-6">
                    <a
                      href={currentLesson.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        {currentLesson.downloadLabel || t("download")}
                      </Button>
                    </a>
                  </div>
                )}

                {/* Navigation */}
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLessonSelect(Math.max(0, activeLesson - 1))}
                    disabled={activeLesson === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t("prevLesson")}
                  </Button>

                  {activeLesson < lessons.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleLessonSelect(
                          Math.min(lessons.length - 1, activeLesson + 1)
                        )
                      }
                    >
                      {t("nextLesson")}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : quizId && !quizPassed ? (
                    <Link href={`/quiz/${quizId}`}>
                      <Button size="sm">
                        <PlayCircle className="w-4 h-4 mr-1" />
                        {t("startQuiz")}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
