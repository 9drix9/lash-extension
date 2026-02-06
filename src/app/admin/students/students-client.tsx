"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resetStudentProgress } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string | null;
  completedModules: number;
  quizAttempts: number;
  certificates: number;
}

interface StudentsClientProps {
  students: Student[];
}

export function StudentsClient({ students }: StudentsClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [resetId, setResetId] = useState<string | null>(null);

  function handleReset(studentId: string) {
    setResetId(studentId);
    startTransition(async () => {
      try {
        await resetStudentProgress(studentId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      } finally {
        setResetId(null);
      }
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("students")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Modules
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  {t("quizzes")}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Certs
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {student.email}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {student.enrolledAt ? (
                      formatDate(student.enrolledAt)
                    ) : (
                      <Badge variant="outline">Not enrolled</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {student.completedModules}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {student.quizAttempts}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {student.certificates > 0 ? (
                      <Badge>{student.certificates}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          {t("resetProgress")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("resetProgress")}</DialogTitle>
                          <DialogDescription>
                            {t("resetConfirm")}
                          </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Student: <strong>{student.name}</strong> ({student.email})
                        </p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">{tc("cancel")}</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              disabled={isPending && resetId === student.id}
                              onClick={() => handleReset(student.id)}
                            >
                              {isPending && resetId === student.id
                                ? tc("loading")
                                : t("resetProgress")}
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
