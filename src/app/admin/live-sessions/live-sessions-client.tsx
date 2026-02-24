"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createLiveSession,
  updateLiveQuestionStatus,
  addSessionReplay,
  deleteLiveSession,
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

interface LiveQuestionData {
  id: string;
  text: string;
  userName: string;
  status: "PENDING" | "ANSWERED" | "PINNED";
  upvotes: number;
  createdAt: string;
}

interface SessionData {
  id: string;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
  scheduledAt: string;
  durationMin: number;
  joinUrl: string;
  replayUrl: string | null;
  rsvpCount: number;
  questions: LiveQuestionData[];
}

interface LiveSessionsClientProps {
  sessions: SessionData[];
}

export function LiveSessionsClient({ sessions }: LiveSessionsClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleCreateSession(formData: FormData) {
    startTransition(async () => {
      try {
        const dateStr = formData.get("date") as string;
        const timeStr = formData.get("time") as string;
        const scheduledAt = new Date(`${dateStr}T${timeStr}`);

        await createLiveSession({
          titleEn: formData.get("titleEn") as string,
          titleEs: (formData.get("titleEs") as string) || undefined,
          descEn: (formData.get("descEn") as string) || undefined,
          descEs: (formData.get("descEs") as string) || undefined,
          scheduledAt,
          durationMin: parseInt(formData.get("durationMin") as string) || 60,
          joinUrl: formData.get("joinUrl") as string,
        });
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleQuestionStatus(
    questionId: string,
    status: "ANSWERED" | "PINNED" | "PENDING"
  ) {
    startTransition(async () => {
      try {
        await updateLiveQuestionStatus(questionId, status);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleDeleteSession(sessionId: string) {
    startTransition(async () => {
      try {
        await deleteLiveSession(sessionId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleAddReplay(sessionId: string, formData: FormData) {
    startTransition(async () => {
      try {
        await addSessionReplay(
          sessionId,
          formData.get("replayUrl") as string,
          (formData.get("notes") as string) || undefined
        );
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isUpcoming(dateStr: string) {
    return new Date(dateStr) > new Date();
  }

  return (
    <div className="space-y-6">
      {/* Create Session Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("createLiveSession")}</CardTitle>
          <CardDescription>{t("scheduleLiveDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateSession(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleEn">{t("titleEn")} *</Label>
                <Input id="titleEn" name="titleEn" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleEs">{t("titleEs")}</Label>
                <Input id="titleEs" name="titleEs" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descEn">{t("descriptionEn")}</Label>
                <textarea
                  id="descEn"
                  name="descEn"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descEs">{t("descriptionEs")}</Label>
                <textarea
                  id="descEs"
                  name="descEs"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">{t("dateLabel")} *</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">{t("timeLabel")} *</Label>
                <Input id="time" name="time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMin">{t("durationMinLabel")}</Label>
                <Input
                  id="durationMin"
                  name="durationMin"
                  type="number"
                  defaultValue={60}
                  min={15}
                  max={480}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinUrl">{t("joinUrlLabel")} *</Label>
              <Input
                id="joinUrl"
                name="joinUrl"
                placeholder="https://zoom.us/j/..."
                required
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? tc("loading") : t("create")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">{session.titleEn}</CardTitle>
                {session.titleEs && (
                  <CardDescription className="text-xs">
                    {t("esLabel")}: {session.titleEs}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={isUpcoming(session.scheduledAt) ? "default" : "secondary"}
                >
                  {isUpcoming(session.scheduledAt) ? t("upcomingLabel") : t("pastLabel")}
                </Badge>
                <Badge variant="outline">
                  {t("rsvpsCount", { count: session.rsvpCount })}
                </Badge>
                <Badge variant="outline">{t("durationDisplay", { count: session.durationMin })}</Badge>

                {/* Delete button with confirmation */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {tc("delete")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{tc("delete")} — {session.titleEn}</DialogTitle>
                      <DialogDescription>
                        This will permanently delete this live session and all its RSVPs and questions. This cannot be undone.
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
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          {tc("delete")}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(session.scheduledAt)}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.descEn && (
              <p className="text-sm text-muted-foreground">{session.descEn}</p>
            )}

            {session.joinUrl && (
              <p className="text-sm">
                <span className="font-medium">{t("joinPrefix")}</span>{" "}
                <a
                  href={session.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {session.joinUrl}
                </a>
              </p>
            )}

            {session.replayUrl && (
              <p className="text-sm">
                <span className="font-medium">{t("replayPrefix")}</span>{" "}
                <a
                  href={session.replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {session.replayUrl}
                </a>
              </p>
            )}

            {/* Add Replay URL */}
            {!session.replayUrl && !isUpcoming(session.scheduledAt) && (
              <div className="rounded-lg bg-muted/50 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddReplay(session.id, new FormData(e.currentTarget));
                  }}
                  className="space-y-3"
                >
                  <Label className="text-xs font-medium">{t("addReplayUrl")}</Label>
                  <div className="flex gap-2">
                    <Input
                      name="replayUrl"
                      placeholder="https://..."
                      required
                      className="h-8"
                    />
                    <Button type="submit" size="sm" disabled={isPending}>
                      {tc("save")}
                    </Button>
                  </div>
                  <Input
                    name="notes"
                    placeholder={t("sessionNotesPlaceholder")}
                    className="h-8"
                  />
                </form>
              </div>
            )}

            {/* Questions */}
            {session.questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {t("questionsHeader", { count: session.questions.length })}
                </h4>
                <div className="space-y-2">
                  {session.questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {q.userName}
                          </span>
                          <Badge
                            variant={
                              q.status === "ANSWERED"
                                ? "default"
                                : q.status === "PINNED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {q.status === "ANSWERED" ? t("answeredLabel") : q.status === "PINNED" ? t("pinLabel") : t("pending")}
                          </Badge>
                          {q.upvotes > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {t("upvotesCount", { count: q.upvotes })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{q.text}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {q.status !== "ANSWERED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              handleQuestionStatus(q.id, "ANSWERED")
                            }
                          >
                            {t("answeredLabel")}
                          </Button>
                        )}
                        {q.status !== "PINNED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              handleQuestionStatus(q.id, "PINNED")
                            }
                          >
                            {t("pinLabel")}
                          </Button>
                        )}
                        {q.status !== "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              handleQuestionStatus(q.id, "PENDING")
                            }
                          >
                            {t("resetLabel")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("noLiveSessions")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
