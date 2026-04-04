import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRemovedStudents } from "@/lib/actions/admin-student";
import { RemovedStudentsClient } from "./removed-students-client";

export default async function RemovedStudentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const students = await getRemovedStudents();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/students"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Students
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Removed Students</h1>
          <p className="mt-1 text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} removed from the course
          </p>
        </div>

        <RemovedStudentsClient students={students} />
      </div>
    </div>
  );
}
