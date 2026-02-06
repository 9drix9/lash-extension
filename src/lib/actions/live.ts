"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function rsvpToSession(sessionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.liveRsvp.upsert({
    where: {
      userId_sessionId: {
        userId: session.user.id,
        sessionId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      sessionId,
    },
  });

  revalidatePath(`/live/${sessionId}`);
  revalidatePath("/live");
}

export async function submitLiveQuestion(sessionId: string, text: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!text.trim()) throw new Error("Question cannot be empty");

  await prisma.liveQuestion.create({
    data: {
      userId: session.user.id,
      sessionId,
      textEn: text.trim(),
    },
  });

  revalidatePath(`/live/${sessionId}`);
}

export async function upvoteQuestion(questionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.liveQuestion.update({
    where: { id: questionId },
    data: { upvotes: { increment: 1 } },
  });

  revalidatePath("/live");
}

export async function getLiveSessions() {
  const now = new Date();

  const upcoming = await prisma.liveSession.findMany({
    where: { scheduledAt: { gte: now } },
    orderBy: { scheduledAt: "asc" },
    include: {
      _count: { select: { rsvps: true, questions: true } },
    },
  });

  const past = await prisma.liveSession.findMany({
    where: { scheduledAt: { lt: now } },
    orderBy: { scheduledAt: "desc" },
    take: 10,
    include: {
      _count: { select: { rsvps: true, questions: true } },
    },
  });

  return { upcoming, past };
}

export async function getSessionDetails(sessionId: string) {
  const session = await auth();

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: {
        orderBy: [
          { status: "asc" },
          { upvotes: "desc" },
          { createdAt: "asc" },
        ],
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { rsvps: true } },
    },
  });

  if (!liveSession) return null;

  let hasRsvped = false;
  if (session?.user) {
    const rsvp = await prisma.liveRsvp.findUnique({
      where: {
        userId_sessionId: {
          userId: session.user.id,
          sessionId,
        },
      },
    });
    hasRsvped = !!rsvp;
  }

  return { ...liveSession, hasRsvped };
}
