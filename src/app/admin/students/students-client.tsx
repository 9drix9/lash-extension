"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resetStudentProgress } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, ArrowUpDown, Download } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string | null;
  lastActivityAt: string | null;
  completedModules: number;
  totalRequired: number;
  progressPercent: number;
  currentModuleId: string | null;
  quizAttempts: number;
  certificates: number;
  paymentStatus: string | null;
  riskFlag: "active" | "inactive" | "at_risk";
}

interface StudentsClientProps {
  students: Student[];
}

type SortKey = "name" | "enrolledAt" | "progressPercent" | "lastActivityAt";
type SortDir = "asc" | "desc";
type Filter = "all" | "active" | "at_risk" | "inactive";

export function StudentsClient({ students }: StudentsClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [resetId, setResetId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("enrolledAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

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

  const filtered = useMemo(() => {
    let list = students;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (filter !== "all") {
      list = list.filter((s) => s.riskFlag === filter);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "enrolledAt")
        cmp =
          (a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0) -
          (b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0);
      else if (sortKey === "progressPercent")
        cmp = a.progressPercent - b.progressPercent;
      else if (sortKey === "lastActivityAt")
        cmp =
          (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0) -
          (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, search, filter, sortKey, sortDir]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const riskBadge = (flag: string) => {
    if (flag === "at_risk")
      return <Badge variant="destructive">{t("atRisk")}</Badge>;
    if (flag === "inactive")
      return <Badge variant="secondary">{t("inactive")}</Badge>;
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        {t("active")}
      </Badge>
    );
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "at_risk", label: t("filterAtRisk") },
    { key: "inactive", label: t("filterInactive") },
  ];

  const SortHeader = ({
    label,
    sortKeyVal,
  }: {
    label: string;
    sortKeyVal: SortKey;
  }) => (
    <th
      className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
      onClick={() => handleSort(sortKeyVal)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">{t("students")}</CardTitle>
          <a
            href="/api/admin/export?type=students"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            {t("exportCsv")}
          </a>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchStudents")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortHeader label={t("name")} sortKeyVal="name" />
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("email")}
                </th>
                <SortHeader label={t("enrolled")} sortKeyVal="enrolledAt" />
                <SortHeader label={t("progress")} sortKeyVal="progressPercent" />
                <SortHeader
                  label={t("lastActivity")}
                  sortKeyVal="lastActivityAt"
                />
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {t("noStudents")}
                  </td>
                </tr>
              )}
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="text-primary hover:underline"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {student.email}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {student.enrolledAt ? (
                      formatDate(student.enrolledAt)
                    ) : (
                      <Badge variant="outline">{t("notEnrolled")}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${student.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {student.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(student.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {riskBadge(student.riskFlag)}
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
                          Student: <strong>{student.name}</strong> (
                          {student.email})
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
