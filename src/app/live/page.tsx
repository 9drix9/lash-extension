import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getActiveCourse } from "@/lib/actions/enrollment";
import { hasActivePayment } from "@/lib/actions/payment";
import { getLiveSessions } from "@/lib/actions/live";
import { LiveSessionsClient } from "./live-client";

export default async function LivePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const course = await getActiveCourse();
  if (!course || !(await hasActivePayment(session.user.id, course.id))) {
    redirect("/enroll");
  }

  const t = await getTranslations("live");
  const { upcoming, past } = await getLiveSessions();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-display font-bold mb-8">{t("title")}</h1>
        <LiveSessionsClient
          upcoming={upcoming.map((s) => ({
            ...s,
            scheduledAt: s.scheduledAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            rsvpCount: s._count.rsvps,
            questionCount: s._count.questions,
          }))}
          past={past.map((s) => ({
            ...s,
            scheduledAt: s.scheduledAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            rsvpCount: s._count.rsvps,
            questionCount: s._count.questions,
          }))}
          isLoggedIn={!!session?.user}
        />
      </div>
    </div>
  );
}
