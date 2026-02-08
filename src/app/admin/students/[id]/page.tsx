import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveCourse } from "@/lib/actions/enrollment";
import {
  getStudentProfile,
  getStudentTimeline,
  getStudentNotes,
  getStudentQuizHistory,
} from "@/lib/actions/admin-student";
import { StudentProfileClient } from "./student-profile-client";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const t = await getTranslations("admin");

  const [profile, timeline, notes, quizHistory, course] = await Promise.all([
    getStudentProfile(id),
    getStudentTimeline(id),
    getStudentNotes(id),
    getStudentQuizHistory(id),
    getActiveCourse(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/students"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("students")}
          </Link>
        </div>

        <StudentProfileClient
          profile={profile}
          timeline={timeline}
          notes={notes}
          quizHistory={quizHistory}
          courseId={course?.id || null}
        />
      </div>
    </div>
  );
}
