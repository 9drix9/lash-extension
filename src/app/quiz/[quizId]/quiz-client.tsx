"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Trophy,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { submitQuiz } from "@/lib/actions/quiz";
import { shuffleArray, cn, getLocalizedField } from "@/lib/utils";
import { toast } from "sonner";

interface QuizOption {
  id: string;
  textEn: string;
  textEs: string;
}

export interface QuizQuestion {
  id: string;
  type: string;
  questionEn: string;
  questionEs: string;
  scenarioEn?: string | null;
  scenarioEs?: string | null;
  options: QuizOption[];
  order: number;
  correctOptionId?: string;
  explanationEn?: string;
  explanationEs?: string;
}

interface QuizData {
  id: string;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
  moduleId: string;
  moduleTitleEn: string;
  moduleTitleEs: string;
}

interface Attempt {
  id: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  answers: { questionId: string; selectedOptionId: string; correct: boolean }[];
  createdAt: string;
}

interface Props {
  quiz: QuizData;
  questions: QuizQuestion[];
  attempts: Attempt[];
  hasPassed: boolean;
  passingScore: number;
  attemptCount: number;
  locale: string;
}

type ViewMode = "quiz" | "result" | "review";

export function QuizClient({
  quiz,
  questions: rawQuestions,
  attempts,
  hasPassed: initialHasPassed,
  passingScore,
  attemptCount: initialAttemptCount,
  locale,
}: Props) {
  const t = useTranslations("quiz");

  // Shuffle questions for retakes
  const [questions] = useState(() =>
    initialAttemptCount > 0 ? shuffleArray(rawQuestions) : rawQuestions
  );

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialHasPassed ? "review" : "quiz"
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    results: { questionId: string; selectedOptionId: string; correct: boolean }[];
  } | null>(null);
  const [hasPassed, setHasPassed] = useState(initialHasPassed);
  const [attemptCount, setAttemptCount] = useState(initialAttemptCount);

  const quizTitle = getLocalizedField(quiz, "title", locale);
  const moduleTitle = getLocalizedField(quiz, "moduleTitle", locale);

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (viewMode !== "quiz") return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const quizAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id],
      }));

      const res = await submitQuiz(quiz.id, quizAnswers);
      setResult(res);
      setViewMode("result");
      setAttemptCount((prev) => prev + 1);

      if (res.passed) {
        setHasPassed(true);
        toast.success(t("passed"));
      }
    } catch {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setViewMode("quiz");
  };

  const question = questions[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;
  const progress = ((currentQ + 1) / questions.length) * 100;

  // Review mode - show last passing attempt
  if (viewMode === "review" && initialHasPassed) {
    const lastPassAttempt = attempts.find((a) => a.passed);

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/module/${quiz.moduleId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">{moduleTitle}</p>
              <h1 className="text-2xl font-display font-bold">{quizTitle}</h1>
            </div>
          </div>

          {/* Pass Summary */}
          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-green-800">{t("passed")}</h2>
              <p className="text-green-700 mt-1">
                {lastPassAttempt
                  ? t("passMessage", { score: Math.round(lastPassAttempt.score) })
                  : ""}
              </p>
            </CardContent>
          </Card>

          {/* Show correct answers */}
          <h3 className="text-lg font-semibold mb-4">{t("correctAnswers")}</h3>
          <div className="space-y-4">
            {questions.map((q, qi) => {
              const options = q.options as QuizOption[];
              return (
                <Card key={q.id}>
                  <CardContent className="p-5">
                    {q.scenarioEn && q.type === "SCENARIO" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">
                          {t("scenario")}
                        </p>
                        <p className="text-sm text-amber-900">
                          {getLocalizedField(q, "scenario", locale)}
                        </p>
                      </div>
                    )}
                    <p className="font-medium mb-3">
                      {qi + 1}. {getLocalizedField(q, "question", locale)}
                    </p>
                    <div className="space-y-2">
                      {options.map((opt) => {
                        const isCorrect = q.correctOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm border",
                              isCorrect
                                ? "bg-green-50 border-green-300 text-green-800"
                                : "border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrect && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                              {locale === "es" && opt.textEs
                                ? opt.textEs
                                : opt.textEn}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanationEn && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          {t("explanation")}
                        </p>
                        <p className="text-sm text-blue-900">
                          {getLocalizedField(q, "explanation", locale)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <Link href="/dashboard">
              <Button>
                {t("continue")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Result mode
  if (viewMode === "result" && result) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className={cn(
            "mb-6",
            result.passed
              ? "border-green-200 bg-green-50/50"
              : "border-red-200 bg-red-50/50"
          )}>
            <CardContent className="p-8 text-center">
              {result.passed ? (
                <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold mb-2">
                {result.passed ? t("passed") : t("failed")}
              </h2>
              <div className="text-4xl font-bold mb-2">
                {Math.round(result.score)}%
              </div>
              <p className={result.passed ? "text-green-700" : "text-red-700"}>
                {result.passed
                  ? t("passMessage", { score: Math.round(result.score) })
                  : t("failMessage", {
                      score: Math.round(result.score),
                      required: passingScore,
                    })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("answeredCorrectly", {
                  correct: result.correctCount,
                  total: result.totalQuestions,
                })}
              </p>
            </CardContent>
          </Card>

          {/* Show results per question */}
          <div className="space-y-3 mb-6">
            {result.passed && (
              <p className="text-sm text-muted-foreground mb-2">
                {t("showAnswers")}
              </p>
            )}
            {!result.passed && (
              <p className="text-sm text-muted-foreground mb-2">
                {t("hiddenAnswers")}
              </p>
            )}
            {questions.map((q, qi) => {
              const r = result.results.find((r) => r.questionId === q.id);
              if (!r) return null;
              const options = q.options as QuizOption[];
              return (
                <Card key={q.id} className={cn(
                  "border-l-4",
                  r.correct ? "border-l-green-500" : "border-l-red-500"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {qi + 1}. {getLocalizedField(q, "question", locale)}
                      </p>
                      {r.correct ? (
                        <Badge className="bg-green-100 text-green-800 flex-shrink-0">
                          <Check className="w-3 h-3 mr-1" />{t("correct")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex-shrink-0">
                          <X className="w-3 h-3 mr-1" />{t("incorrect")}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {options.map((opt) => {
                        const isSelected = r.selectedOptionId === opt.id;
                        const isCorrect = result.passed && q.correctOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              "px-3 py-1.5 rounded text-sm",
                              isCorrect && "bg-green-50 text-green-800 font-medium",
                              isSelected && !r.correct && "bg-red-50 text-red-800",
                              isSelected && r.correct && "bg-green-50 text-green-800 font-medium",
                              !isSelected && !isCorrect && "text-muted-foreground"
                            )}
                          >
                            {locale === "es" && opt.textEs ? opt.textEs : opt.textEn}
                            {isSelected && " ← " + t("yourAnswer")}
                            {isCorrect && !isSelected && " ✓"}
                          </div>
                        );
                      })}
                    </div>
                    {result.passed && q.explanationEn && (
                      <div className="mt-2 bg-blue-50 rounded p-2">
                        <p className="text-xs text-blue-800">
                          {getLocalizedField(q, "explanation", locale)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            {result.passed ? (
              <Link href="/dashboard">
                <Button>
                  {t("continue")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button onClick={handleRetake}>
                <RotateCcw className="w-4 h-4 mr-1" />
                {t("retake")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz mode
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/module/${quiz.moduleId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{moduleTitle}</p>
            <h1 className="text-xl font-display font-bold">{quizTitle}</h1>
          </div>
          {attemptCount > 0 && (
            <Badge variant="outline">
              {t("attempt")} #{attemptCount + 1}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              {t("question")} {currentQ + 1} {t("of")} {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        {question && (
          <Card className="mb-6">
            <CardContent className="p-6">
              {/* Scenario */}
              {question.scenarioEn && question.type === "SCENARIO" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    {t("scenario")}
                  </p>
                  <p className="text-sm text-amber-900">
                    {getLocalizedField(question, "scenario", locale)}
                  </p>
                </div>
              )}

              {/* Question */}
              <h2 className="text-lg font-medium mb-4">
                {getLocalizedField(question, "question", locale)}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {(question.options as QuizOption[]).map((option) => {
                  const isSelected = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(question.id, option.id)}
                      className={cn(
                        "quiz-option w-full text-left px-4 py-3 rounded-xl border-2 text-sm",
                        isSelected ? "selected" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span>
                          {locale === "es" && option.textEs
                            ? option.textEs
                            : option.textEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("prevQuestion")}
          </Button>

          {currentQ < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQ(currentQ + 1)}
            >
              {t("nextQuestion")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "..." : t("submitQuiz")}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-6">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                i === currentQ
                  ? "bg-primary text-white"
                  : answers[q.id]
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
