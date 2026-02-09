"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  User,
  Mail,
  CreditCard,
  FileText,
  MessageSquare,
  Trash2,
  Unlock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  addAdminNote,
  deleteAdminNote,
  resetStudentQuiz,
  unlockModuleForStudent,
  grantCertificate,
} from "@/lib/actions/admin-student";

interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  enrolledAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  paymentStatus: string | null;
  paymentType: string | null;
  amountPaid: number;
  moduleProgress: {
    moduleId: string;
    titleEn: string;
    order: number;
    isBonus: boolean;
    status: string;
  }[];
  certificates: { code: string; issuedAt: string }[];
  totalQuizAttempts: number;
}

interface TimelineEvent {
  type: "lesson" | "module" | "quiz_pass" | "quiz_fail" | "certificate";
  titleEn: string;
  detail?: string;
  timestamp: string;
}

interface Note {
  id: string;
  adminName: string;
  content: string;
  createdAt: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  moduleTitle: string;
  moduleOrder: number;
  score: number;
  passed: boolean;
  attemptNumber: number;
  createdAt: string;
}

interface Props {
  profile: Profile;
  timeline: TimelineEvent[];
  notes: Note[];
  quizHistory: QuizAttempt[];
  courseId: string | null;
}

export function StudentProfileClient({
  profile,
  timeline,
  notes: initialNotes,
  quizHistory,
  courseId,
}: Props) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "quizzes" | "notes" | "actions"
  >("timeline");

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const content = noteText.trim();
    setNoteText("");
    startTransition(async () => {
      try {
        await addAdminNote(profile.id, content);
        toast.success(t("noteAdded"));
        // Optimistic: add to local state
        setNotes((prev) => [
          { id: `temp-${Date.now()}`, adminName: "You", content, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      try {
        await deleteAdminNote(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success(t("noteDeleted"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleResetQuiz = (quizId: string) => {
    startTransition(async () => {
      try {
        await resetStudentQuiz(profile.id, quizId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleUnlockModule = (moduleId: string) => {
    startTransition(async () => {
      try {
        await unlockModuleForStudent(profile.id, moduleId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleGrantCertificate = () => {
    if (!courseId) return;
    startTransition(async () => {
      try {
        await grantCertificate(profile.id, courseId);
        toast.success(t("certificateGranted"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const tabs = [
    { key: "timeline" as const, label: t("timeline") },
    { key: "quizzes" as const, label: t("quizHistory") },
    { key: "notes" as const, label: t("notes") },
    { key: "actions" as const, label: t("adminActions") },
  ];

  const eventIcons: Record<string, React.ReactNode> = {
    lesson: <BookOpen className="h-4 w-4 text-blue-500" />,
    module: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    quiz_pass: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    quiz_fail: <XCircle className="h-4 w-4 text-red-500" />,
    certificate: <Award className="h-4 w-4 text-gold" />,
  };

  const eventLabels: Record<string, string> = {
    lesson: t("lessonCompleted"),
    module: t("moduleCompleted"),
    quiz_pass: t("quizPassed"),
    quiz_fail: t("quizFailed"),
    certificate: t("certificateIssued"),
  };

  // Group quizzes by quizId for the reset action
  const uniqueQuizIds = [...new Set(quizHistory.map((q) => q.quizId))];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {profile.image ? (
              <img
                src={profile.image}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t("enrolled")}: {formatDate(profile.enrolledAt)}
                </span>
                {profile.paymentStatus && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {t("paymentStatus")}: {profile.paymentStatus}
                    {profile.amountPaid > 0 &&
                      ` ($${(profile.amountPaid / 100).toFixed(0)})`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.certificates.length > 0 && (
                <Badge className="bg-gold/10 text-gold">
                  <Award className="mr-1 h-3 w-3" />
                  {profile.certificates[0].code}
                </Badge>
              )}
              {profile.lastActivityAt && (
                <Badge variant="outline">
                  {t("lastActivity")}: {formatDate(profile.lastActivityAt)}
                </Badge>
              )}
            </div>
          </div>

          {/* Module Progress */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {t("progress")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.moduleProgress
                .filter((m) => !m.isBonus)
                .map((m) => (
                  <div
                    key={m.moduleId}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                      m.status === "COMPLETED"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : m.status === "UNLOCKED"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : m.status === "UNLOCKED" ? (
                      <BookOpen className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    M{m.order}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <Card>
          <CardContent className="pt-6">
            {timeline.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("noActivityYet")}
              </p>
            ) : (
              <div className="space-y-1">
                {timeline.slice(0, 50).map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {eventIcons[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {eventLabels[event.type]}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {event.titleEn}
                      </p>
                      {event.detail && (
                        <p className="text-xs text-muted-foreground">
                          {event.detail}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz History Tab */}
      {activeTab === "quizzes" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("quizHeader")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("attempt")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("score")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("status")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("date")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quizHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        {t("noQuizAttempts")}
                      </td>
                    </tr>
                  )}
                  {quizHistory.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{q.quizTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          M{q.moduleOrder} - {q.moduleTitle}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        #{q.attemptNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {q.score}%
                      </td>
                      <td className="px-4 py-3">
                        {q.passed ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {t("pass")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">{t("fail")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(q.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note */}
            <div className="flex gap-2">
              <Input
                placeholder={t("addNotePlaceholder")}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <Button
                onClick={handleAddNote}
                disabled={isPending || !noteText.trim()}
                size="sm"
              >
                {t("addNote")}
              </Button>
            </div>

            {/* Notes list */}
            {notes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t("noNotesYet")}
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{note.adminName}</span>
                        <span>&middot;</span>
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Actions Tab */}
      {activeTab === "actions" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Reset Quiz */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RotateCcw className="h-4 w-4" />
                {t("resetQuiz")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {uniqueQuizIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noQuizToReset")}
                </p>
              ) : (
                uniqueQuizIds.map((quizId) => {
                  const quiz = quizHistory.find((q) => q.quizId === quizId)!;
                  return (
                    <Dialog key={quizId}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          M{quiz.moduleOrder}: {quiz.quizTitle}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("resetQuiz")}</DialogTitle>
                          <DialogDescription>
                            {t("resetQuizConfirm")}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">{tc("cancel")}</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleResetQuiz(quizId)}
                            >
                              {t("resetQuiz")}
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Unlock Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Unlock className="h-4 w-4" />
                {t("unlockModule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.moduleProgress
                .filter((m) => m.status === "LOCKED")
                .map((m) => (
                  <Button
                    key={m.moduleId}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleUnlockModule(m.moduleId)}
                    disabled={isPending}
                  >
                    <Unlock className="mr-2 h-3.5 w-3.5" />
                    M{m.order}: {m.titleEn}
                  </Button>
                ))}
              {profile.moduleProgress.filter((m) => m.status === "LOCKED")
                .length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("allModulesUnlocked")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Grant Certificate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4" />
                {t("grantCertificate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.certificates.length > 0 ? (
                <div className="space-y-2">
                  {profile.certificates.map((cert) => (
                    <div
                      key={cert.code}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Award className="h-4 w-4 text-gold" />
                      <span className="font-medium">{cert.code}</span>
                      <span className="text-muted-foreground">
                        {formatDate(cert.issuedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!courseId}
                    >
                      <Award className="mr-2 h-3.5 w-3.5" />
                      {t("grantCertificate")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("grantCertificate")}</DialogTitle>
                      <DialogDescription>
                        {t("grantCertificateConfirm")}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{tc("cancel")}</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={handleGrantCertificate}>
                          {t("grantCertificate")}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
