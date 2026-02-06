"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  PlayCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  questionCount: number;
}

interface Props {
  upcoming: SessionData[];
  past: SessionData[];
  isLoggedIn: boolean;
}

export function LiveSessionsClient({ upcoming, past, isLoggedIn }: Props) {
  const t = useTranslations("live");

  return (
    <Tabs defaultValue="upcoming">
      <TabsList className="mb-6">
        <TabsTrigger value="upcoming">
          {t("upcoming")} ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          {t("past")} ({past.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("noSessions")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcoming.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">
                        {session.titleEn}
                      </h3>
                      {session.descEn && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {session.descEn}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.scheduledAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({session.durationMin} min)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.rsvpCount} RSVPs
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Countdown targetDate={session.scheduledAt} />
                      <Link href={`/live/${session.id}`}>
                        <Button size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {t("questions")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        <div className="space-y-4">
          {past.map((session) => (
            <Card key={session.id} className="opacity-90">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{session.titleEn}</h3>
                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(session.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {session.questionCount} questions
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.replayUrl && (
                      <a
                        href={session.replayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <PlayCircle className="w-4 h-4 mr-1" />
                          {t("replay")}
                        </Button>
                      </a>
                    )}
                    <Link href={`/live/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        {t("questions")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
