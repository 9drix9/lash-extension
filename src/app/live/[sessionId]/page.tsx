import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSessionDetails } from "@/lib/actions/live";
import { SessionClient } from "./session-client";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const data = await getSessionDetails(sessionId);
  if (!data) notFound();

  return (
    <SessionClient
      session={{
        id: data.id,
        titleEn: data.titleEn,
        descEn: data.descEn,
        scheduledAt: data.scheduledAt.toISOString(),
        durationMin: data.durationMin,
        joinUrl: data.joinUrl,
        replayUrl: data.replayUrl || null,
        notesEn: data.notesEn || null,
        rsvpCount: data._count.rsvps,
        questions: data.questions.map((q) => ({
          id: q.id,
          textEn: q.textEn,
          status: q.status,
          upvotes: q.upvotes,
          createdAt: q.createdAt.toISOString(),
          answeredAt: q.answeredAt?.toISOString() || null,
          userName: q.user.name || q.user.email,
        })),
      }}
      hasRsvped={data.hasRsvped}
      userId={session.user.id}
    />
  );
}
