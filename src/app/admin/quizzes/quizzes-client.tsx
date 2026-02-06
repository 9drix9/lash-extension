"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  updateQuizPassingScore,
  updatePassingScore,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuestionData {
  id: string;
  type: "MCQ" | "SCENARIO";
  questionEn: string;
  questionEs: string;
  scenarioEn: string | null;
  scenarioEs: string | null;
  options: { id: string; textEn: string; textEs: string }[];
  correctOptionId: string;
  explanationEn: string;
  explanationEs: string;
  order: number;
}

interface QuizData {
  id: string;
  titleEn: string;
  titleEs: string;
  moduleName: string;
  moduleOrder: number;
  passingScore: number | null;
  questions: QuestionData[];
}

interface QuizzesClientProps {
  quizzes: QuizData[];
  courseId: string;
  globalPassingScore: number;
}

export function QuizzesClient({
  quizzes,
  courseId,
  globalPassingScore,
}: QuizzesClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [globalScore, setGlobalScore] = useState(globalPassingScore.toString());
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  function handleGlobalScoreUpdate() {
    startTransition(async () => {
      try {
        await updatePassingScore(courseId, parseInt(globalScore));
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleQuizScoreUpdate(quizId: string, score: string) {
    startTransition(async () => {
      try {
        const parsed = score === "" ? null : parseInt(score);
        await updateQuizPassingScore(quizId, parsed);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleDeleteQuestion(questionId: string) {
    startTransition(async () => {
      try {
        await deleteQuestion(questionId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Global Passing Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Passing Score</CardTitle>
          <CardDescription>
            Default passing score applied to all quizzes unless overridden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="globalScore">{t("passingScore")}</Label>
              <Input
                id="globalScore"
                type="number"
                min={1}
                max={100}
                value={globalScore}
                onChange={(e) => setGlobalScore(e.target.value)}
                className="w-28"
              />
            </div>
            <Button
              onClick={handleGlobalScoreUpdate}
              disabled={isPending}
              size="sm"
            >
              {tc("save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz List */}
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          globalPassingScore={globalPassingScore}
          isPending={isPending}
          isExpanded={expandedQuiz === quiz.id}
          onToggle={() =>
            setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)
          }
          onScoreUpdate={handleQuizScoreUpdate}
          onDeleteQuestion={handleDeleteQuestion}
        />
      ))}
    </div>
  );
}

function QuizCard({
  quiz,
  globalPassingScore,
  isPending,
  isExpanded,
  onToggle,
  onScoreUpdate,
  onDeleteQuestion,
}: {
  quiz: QuizData;
  globalPassingScore: number;
  isPending: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onScoreUpdate: (quizId: string, score: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [localScore, setLocalScore] = useState(
    quiz.passingScore?.toString() || ""
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              Module {quiz.moduleOrder}: {quiz.moduleName}
            </CardTitle>
            <CardDescription>
              {quiz.titleEn} -- {quiz.questions.length} questions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={quiz.passingScore ? "default" : "outline"}>
              Pass: {quiz.passingScore ?? globalPassingScore}%
              {!quiz.passingScore && " (global)"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Score Override */}
        <div className="mb-4 flex items-end gap-3 rounded-lg bg-muted/50 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`score-${quiz.id}`} className="text-xs">
              Override Passing Score (leave empty for global)
            </Label>
            <Input
              id={`score-${quiz.id}`}
              type="number"
              min={1}
              max={100}
              value={localScore}
              onChange={(e) => setLocalScore(e.target.value)}
              placeholder={`${globalPassingScore}`}
              className="h-8 w-28"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => onScoreUpdate(quiz.id, localScore)}
          >
            {tc("save")}
          </Button>
        </div>

        {/* Toggle Questions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="mb-2 w-full justify-between"
        >
          <span>
            {isExpanded ? "Hide" : "Show"} Questions ({quiz.questions.length})
          </span>
          <span>{isExpanded ? "\u25B2" : "\u25BC"}</span>
        </Button>

        {isExpanded && (
          <div className="space-y-3">
            {quiz.questions.map((question, idx) => (
              <QuestionItem
                key={question.id}
                question={question}
                index={idx}
                isPending={isPending}
                onDelete={onDeleteQuestion}
                quizId={quiz.id}
              />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <AddQuestionDialog quizId={quiz.id} isPending={isPending} />
      </CardFooter>
    </Card>
  );
}

function QuestionItem({
  question,
  index,
  isPending,
  onDelete,
  quizId,
}: {
  question: QuestionData;
  index: number;
  isPending: boolean;
  onDelete: (id: string) => void;
  quizId: string;
}) {
  const tc = useTranslations("common");
  const [isEditPending, startEditTransition] = useTransition();

  function handleEditSubmit(formData: FormData) {
    startEditTransition(async () => {
      try {
        const optionCount = parseInt(formData.get("optionCount") as string) || 0;
        const options: { id: string; textEn: string; textEs: string }[] = [];
        for (let i = 0; i < optionCount; i++) {
          options.push({
            id: formData.get(`option-id-${i}`) as string,
            textEn: formData.get(`option-en-${i}`) as string,
            textEs: formData.get(`option-es-${i}`) as string,
          });
        }

        await updateQuestion(question.id, {
          questionEn: formData.get("questionEn") as string,
          questionEs: formData.get("questionEs") as string,
          scenarioEn: (formData.get("scenarioEn") as string) || undefined,
          scenarioEs: (formData.get("scenarioEs") as string) || undefined,
          options,
          correctOptionId: formData.get("correctOptionId") as string,
          explanationEn: formData.get("explanationEn") as string,
          explanationEs: formData.get("explanationEs") as string,
        });
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Q{index + 1}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {question.type}
            </Badge>
          </div>
          <p className="mt-1 text-sm">{question.questionEn}</p>
          <div className="mt-1 space-y-0.5">
            {question.options.map((opt) => (
              <p
                key={opt.id}
                className={`text-xs ${
                  opt.id === question.correctOptionId
                    ? "font-medium text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                {opt.id === question.correctOptionId ? "[correct] " : ""}
                {opt.textEn}
              </p>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {tc("edit")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Question {index + 1}</DialogTitle>
                <DialogDescription>
                  {question.type} question
                </DialogDescription>
              </DialogHeader>
              <EditQuestionForm
                question={question}
                isPending={isEditPending}
                onSubmit={handleEditSubmit}
              />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                {tc("delete")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Question</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the
                  question.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{tc("cancel")}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => onDelete(question.id)}
                  >
                    {tc("delete")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function EditQuestionForm({
  question,
  isPending,
  onSubmit,
}: {
  question: QuestionData;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  const tc = useTranslations("common");
  const [options, setOptions] = useState(question.options);
  const [correctId, setCorrectId] = useState(question.correctOptionId);

  function addOption() {
    setOptions([
      ...options,
      { id: `opt_${Date.now()}`, textEn: "", textEs: "" },
    ]);
  }

  function removeOption(idx: number) {
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (options[idx].id === correctId && updated.length > 0) {
      setCorrectId(updated[0].id);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="optionCount" value={options.length} />
      <input type="hidden" name="correctOptionId" value={correctId} />

      <div className="space-y-2">
        <Label>Question (EN)</Label>
        <textarea
          name="questionEn"
          defaultValue={question.questionEn}
          required
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label>Question (ES)</Label>
        <textarea
          name="questionEs"
          defaultValue={question.questionEs}
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {question.type === "SCENARIO" && (
        <>
          <div className="space-y-2">
            <Label>Scenario (EN)</Label>
            <textarea
              name="scenarioEn"
              defaultValue={question.scenarioEn || ""}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Scenario (ES)</Label>
            <textarea
              name="scenarioEs"
              defaultValue={question.scenarioEs || ""}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            + Add Option
          </Button>
        </div>
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            className={`rounded-lg border p-3 ${
              opt.id === correctId ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
            }`}
          >
            <input type="hidden" name={`option-id-${idx}`} value={opt.id} />
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectId(opt.id)}
                  className={`h-4 w-4 rounded-full border-2 ${
                    opt.id === correctId
                      ? "border-green-500 bg-green-500"
                      : "border-muted-foreground"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {opt.id === correctId ? "Correct" : "Mark correct"}
                </span>
              </div>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={() => removeOption(idx)}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                name={`option-en-${idx}`}
                defaultValue={opt.textEn}
                placeholder="Option text (EN)"
                required
              />
              <Input
                name={`option-es-${idx}`}
                defaultValue={opt.textEs}
                placeholder="Option text (ES)"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Explanation (EN)</Label>
          <textarea
            name="explanationEn"
            defaultValue={question.explanationEn}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-2">
          <Label>Explanation (ES)</Label>
          <textarea
            name="explanationEs"
            defaultValue={question.explanationEs}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {tc("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? tc("loading") : tc("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AddQuestionDialog({
  quizId,
  isPending: parentPending,
}: {
  quizId: string;
  isPending: boolean;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"MCQ" | "SCENARIO">("MCQ");
  const [options, setOptions] = useState([
    { id: "a", textEn: "", textEs: "" },
    { id: "b", textEn: "", textEs: "" },
    { id: "c", textEn: "", textEs: "" },
    { id: "d", textEn: "", textEs: "" },
  ]);
  const [correctId, setCorrectId] = useState("a");

  function addOption() {
    const id = String.fromCharCode(97 + options.length);
    setOptions([...options, { id, textEn: "", textEs: "" }]);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const parsedOptions: { id: string; textEn: string; textEs: string }[] = [];
        const count = parseInt(formData.get("optionCount") as string) || 0;
        for (let i = 0; i < count; i++) {
          parsedOptions.push({
            id: formData.get(`option-id-${i}`) as string,
            textEn: formData.get(`option-en-${i}`) as string,
            textEs: (formData.get(`option-es-${i}`) as string) || "",
          });
        }

        await createQuestion(quizId, {
          type,
          questionEn: formData.get("questionEn") as string,
          questionEs: (formData.get("questionEs") as string) || undefined,
          scenarioEn: (formData.get("scenarioEn") as string) || undefined,
          scenarioEs: (formData.get("scenarioEs") as string) || undefined,
          options: parsedOptions,
          correctOptionId: formData.get("correctOptionId") as string,
          explanationEn: (formData.get("explanationEn") as string) || undefined,
          explanationEs: (formData.get("explanationEs") as string) || undefined,
        });
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          {t("addQuestion")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("addQuestion")}</DialogTitle>
          <DialogDescription>
            Add a new question to this quiz
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <input type="hidden" name="optionCount" value={options.length} />
          <input type="hidden" name="correctOptionId" value={correctId} />

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "MCQ" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("MCQ")}
              >
                MCQ
              </Button>
              <Button
                type="button"
                variant={type === "SCENARIO" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("SCENARIO")}
              >
                Scenario
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question (EN) *</Label>
            <textarea
              name="questionEn"
              required
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Question (ES)</Label>
            <textarea
              name="questionEs"
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {type === "SCENARIO" && (
            <>
              <div className="space-y-2">
                <Label>Scenario (EN)</Label>
                <textarea
                  name="scenarioEn"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Scenario (ES)</Label>
                <textarea
                  name="scenarioEs"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                + Add Option
              </Button>
            </div>
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className={`rounded-lg border p-3 ${
                  opt.id === correctId
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : ""
                }`}
              >
                <input
                  type="hidden"
                  name={`option-id-${idx}`}
                  value={opt.id}
                />
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectId(opt.id)}
                    className={`h-4 w-4 rounded-full border-2 ${
                      opt.id === correctId
                        ? "border-green-500 bg-green-500"
                        : "border-muted-foreground"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {opt.id === correctId ? "Correct" : "Mark correct"}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    name={`option-en-${idx}`}
                    placeholder="Option text (EN)"
                    required
                  />
                  <Input
                    name={`option-es-${idx}`}
                    placeholder="Option text (ES)"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Explanation (EN)</Label>
              <textarea
                name="explanationEn"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Explanation (ES)</Label>
              <textarea
                name="explanationEs"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {tc("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || parentPending}>
              {isPending ? tc("loading") : t("addQuestion")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
