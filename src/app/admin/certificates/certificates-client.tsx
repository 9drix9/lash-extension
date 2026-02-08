"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Award, Download, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { grantCertificate } from "@/lib/actions/admin-student";

interface EligibleStudent {
  id: string;
  name: string;
  email: string;
  courseId: string;
}

interface CertificateRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  code: string;
  issuedAt: string;
}

interface Props {
  eligible: EligibleStudent[];
  history: CertificateRecord[];
}

export function CertificatesClient({ eligible, history }: Props) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"eligible" | "history">(
    "eligible"
  );

  function handleGrant(studentId: string, courseId: string) {
    startTransition(async () => {
      try {
        await grantCertificate(studentId, courseId);
        setGrantedIds((prev) => new Set([...prev, studentId]));
        toast.success(t("certificateGranted"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Tab Switch */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "eligible"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("eligibilityQueue")}
          {eligible.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {eligible.filter((e) => !grantedIds.has(e.id)).length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("certificateHistory")}
          <Badge className="ml-2" variant="outline">
            {history.length}
          </Badge>
        </button>
      </div>

      {/* Eligibility Queue */}
      {activeTab === "eligible" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5" />
              {t("eligibilityQueue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligible.filter((e) => !grantedIds.has(e.id)).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noEligible")}
              </p>
            ) : (
              <div className="space-y-2">
                {eligible
                  .filter((e) => !grantedIds.has(e.id))
                  .map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleGrant(student.id, student.courseId)
                        }
                        disabled={isPending}
                      >
                        <Award className="mr-1.5 h-3.5 w-3.5" />
                        {t("grantCertificate")}
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certificate History */}
      {activeTab === "history" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              {t("certificateHistory")}
            </CardTitle>
            <a
              href="/api/admin/export?type=certificates"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Download className="h-4 w-4" />
              {t("exportCsv")}
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("name")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("code")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("issuedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{cert.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {cert.studentEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {cert.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(cert.issuedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
