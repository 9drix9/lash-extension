"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  HelpCircle,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleAnalytics {
  id: string;
  titleEn: string;
  order: number;
  totalLessons: number;
  started: number;
  completed: number;
  completionRate: number;
  dropOffRate: number;
  avgDays: number;
  stuckCount: number;
}

interface QuestionStat {
  id: string;
  questionEn: string;
  correctRate: number;
  totalAnswered: number;
}

interface QuizAnalytics {
  id: string;
  titleEn: string;
  moduleTitleEn: string;
  moduleOrder: number;
  totalAttempts: number;
  passRate: number;
  avgScore: number;
  repeatFailures: number;
  questionStats: QuestionStat[];
}

interface Props {
  moduleData: ModuleAnalytics[];
  quizData: QuizAnalytics[];
}

export function AnalyticsClient({ moduleData, quizData }: Props) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<"modules" | "quizzes">("modules");
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Tab Switch */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "modules"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="mr-1.5 inline h-4 w-4" />
          {t("moduleAnalytics")}
        </button>
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "quizzes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HelpCircle className="mr-1.5 inline h-4 w-4" />
          {t("quizAnalytics")}
        </button>
      </div>

      {/* Module Analytics */}
      {activeTab === "modules" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("moduleHeader")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("started")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("completed")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("rate")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("dropOff")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("avgDays")}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t("stuckCount")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {moduleData.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium">
                          M{m.order}: {m.titleEn}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t("lessonsInModule", { count: m.totalLessons })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.started}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.completed}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span
                          className={
                            m.completionRate >= 70
                              ? "text-green-600"
                              : m.completionRate >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        >
                          {m.completionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.dropOffRate > 50 ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-3 w-3" />
                            {m.dropOffRate}%
                          </span>
                        ) : (
                          <span>{m.dropOffRate}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.avgDays > 0 ? t("daysShort", { count: m.avgDays }) : "--"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.stuckCount > 0 ? (
                          <Badge variant="destructive">{m.stuckCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Analytics */}
      {activeTab === "quizzes" && (
        <div className="space-y-4">
          {quizData.map((q) => (
            <Card key={q.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedQuiz(expandedQuiz === q.id ? null : q.id)
                }
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    M{q.moduleOrder}: {q.titleEn}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-4 text-sm">
                      <span>
                        {t("totalAttempts")}:{" "}
                        <strong>{q.totalAttempts}</strong>
                      </span>
                      <span>
                        {t("passRate")}:{" "}
                        <strong
                          className={
                            q.passRate >= 70
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {q.passRate}%
                        </strong>
                      </span>
                      <span>
                        {t("avgScore")}: <strong>{q.avgScore}%</strong>
                      </span>
                    </div>
                    {q.repeatFailures > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {q.repeatFailures} {t("repeatFailures").toLowerCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedQuiz === q.id && q.questionStats.length > 0 && (
                <CardContent className="pt-0">
                  <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                    {t("questionsBreakdown")}
                  </h4>
                  <div className="space-y-2">
                    {q.questionStats.map((qs) => (
                      <div
                        key={qs.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{qs.questionEn}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {t("answersCount", { count: qs.totalAnswered })}
                          </span>
                          <div className="flex items-center gap-2 w-32">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${
                                  qs.correctRate >= 70
                                    ? "bg-green-500"
                                    : qs.correctRate >= 40
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${qs.correctRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">
                              {qs.correctRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
