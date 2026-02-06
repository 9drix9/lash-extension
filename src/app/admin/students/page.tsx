import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStudents } from "@/lib/actions/admin";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const students = await getStudents();

  const studentsData = students.map((student) => ({
    id: student.id,
    name: student.name || "No name",
    email: student.email,
    enrolledAt: student.enrolledAt?.toISOString() || null,
    completedModules: student.moduleProgress.filter(
      (mp) => mp.status === "COMPLETED"
    ).length,
    quizAttempts: student._count.quizAttempts,
    certificates: student._count.certificates,
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
          <h1 className="text-3xl font-bold tracking-tight">{t("students")}</h1>
          <p className="mt-1 text-muted-foreground">
            {studentsData.length} students total
          </p>
        </div>

        <StudentsClient students={studentsData} />
      </div>
    </div>
  );
}
