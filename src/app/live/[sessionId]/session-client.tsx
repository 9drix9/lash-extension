"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Pin,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Countdown } from "@/components/countdown";
import {
  rsvpToSession,
  submitLiveQuestion,
  upvoteQuestion,
} from "@/lib/actions/live";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuestionData {
  id: string;
  textEn: string;
  status: string;
  upvotes: number;
  createdAt: string;
  answeredAt: string | null;
  userName: string;
}

interface SessionData {
  id: string;
  titleEn: string;
  descEn: string;
  scheduledAt: string;
  durationMin: number;
  joinUrl: string;
  replayUrl: string | null;
  notesEn: string | null;
  rsvpCount: number;
  questions: QuestionData[];
}

interface Props {
  session: SessionData;
  hasRsvped: boolean;
  userId: string;
}

export function SessionClient({
  session,
  hasRsvped: initialRsvped,
  userId,
}: Props) {
  const t = useTranslations("live");
  const [hasRsvped, setHasRsvped] = useState(initialRsvped);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isUpcoming = new Date(session.scheduledAt) > new Date();
  const isLive =
    new Date(session.scheduledAt) <= new Date() &&
    new Date(session.scheduledAt).getTime() + session.durationMin * 60000 >
      Date.now();

  const handleRsvp = async () => {
    try {
      await rsvpToSession(session.id);
      setHasRsvped(true);
      toast.success(t("rsvped"));
    } catch {
      toast.error("Failed to RSVP");
    }
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      await submitLiveQuestion(session.id, questionText);
      setQuestionText("");
      toast.success("Question submitted!");
    } catch {
      toast.error("Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      await upvoteQuestion(questionId);
    } catch {
      // ignore
    }
  };

  const pinnedQuestions = session.questions.filter(
    (q) => q.status === "PINNED"
  );
  const answeredQuestions = session.questions.filter(
    (q) => q.status === "ANSWERED"
  );
  const pendingQuestions = session.questions.filter(
    (q) => q.status === "PENDING"
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/live">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        {/* Session Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isLive && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      LIVE
                    </Badge>
                  )}
                  <h1 className="text-2xl font-display font-bold">
                    {session.titleEn}
                  </h1>
                </div>
                {session.descEn && (
                  <p className="text-muted-foreground mb-4">{session.descEn}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(session.scheduledAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(session.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {session.rsvpCount} RSVPs
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {isUpcoming && (
                  <Countdown targetDate={session.scheduledAt} />
                )}
                {(isUpcoming || isLive) && !hasRsvped && (
                  <Button onClick={handleRsvp}>
                    {t("rsvp")}
                  </Button>
                )}
                {hasRsvped && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t("rsvped")}
                  </Badge>
                )}
                {(isLive || isUpcoming) && session.joinUrl && (
                  <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {t("join")}
                    </Button>
                  </a>
                )}
                {session.replayUrl && (
                  <a href={session.replayUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      {t("replay")}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Notes */}
        {session.notesEn && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: session.notesEn }}
              />
            </CardContent>
          </Card>
        )}

        {/* Q&A Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t("questions")} ({session.questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Ask Question */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder={t("yourQuestion")}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSubmitQuestion()
                }
              />
              <Button
                onClick={handleSubmitQuestion}
                disabled={submitting || !questionText.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Pinned */}
            {pinnedQuestions.length > 0 && (
              <div className="mb-4">
                {pinnedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2"
                  >
                    <div className="flex items-start gap-2">
                      <Pin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{q.textEn}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.userName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t("pinned")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Questions */}
            <div className="space-y-2">
              {[...pendingQuestions, ...answeredQuestions].map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    "border rounded-lg p-3",
                    q.status === "ANSWERED" && "bg-green-50/50 border-green-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleUpvote(q.id)}
                      className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowUpCircle className="w-5 h-5" />
                      <span className="text-xs font-medium">{q.upvotes}</span>
                    </button>
                    <div className="flex-1">
                      <p className="text-sm">{q.textEn}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {q.userName} &middot;{" "}
                        {new Date(q.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {q.status === "ANSWERED" && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t("answered")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {session.questions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No questions yet. Be the first to ask!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
