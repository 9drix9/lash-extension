import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiveSessionsClient } from "./live-sessions-client";

export default async function LiveSessionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const sessions = await prisma.liveSession.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      _count: {
        select: { rsvps: true },
      },
      questions: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  const sessionsData = sessions.map((s) => ({
    id: s.id,
    titleEn: s.titleEn,
    titleEs: s.titleEs,
    descEn: s.descEn,
    descEs: s.descEs,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMin: s.durationMin,
    joinUrl: s.joinUrl,
    replayUrl: s.replayUrl,
    rsvpCount: s._count.rsvps,
    questions: s.questions.map((q) => ({
      id: q.id,
      text: q.textEn,
      userName: q.user.name || q.user.email,
      status: q.status as "PENDING" | "ANSWERED" | "PINNED",
      upvotes: q.upvotes,
      createdAt: q.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("title")}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("liveSessions")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {sessionsData.length} sessions total
          </p>
        </div>

        <LiveSessionsClient sessions={sessionsData} />
      </div>
    </div>
  );
}
