import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStudentsEnhanced } from "@/lib/actions/admin-student";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");
  const students = await getStudentsEnhanced();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("backToAdmin")}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("students")}</h1>
          <p className="mt-1 text-muted-foreground">
            {students.length} {t("totalStudents").toLowerCase()}
          </p>
        </div>

        <StudentsClient students={students} />
      </div>
    </div>
  );
}
