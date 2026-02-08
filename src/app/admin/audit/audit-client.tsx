"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuditLog } from "@/lib/actions/admin-audit";

interface AuditEntry {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogData {
  logs: AuditEntry[];
  total: number;
  totalPages: number;
  page: number;
}

interface Props {
  initialLog: AuditLogData;
}

const actionColors: Record<string, string> = {
  RESET_QUIZ: "bg-amber-100 text-amber-800",
  RESET_PROGRESS: "bg-red-100 text-red-800",
  UNLOCK_MODULE: "bg-blue-100 text-blue-800",
  GRANT_CERTIFICATE: "bg-green-100 text-green-800",
  ADD_NOTE: "bg-gray-100 text-gray-800",
  DELETE_NOTE: "bg-gray-100 text-gray-800",
};

export function AuditClient({ initialLog }: Props) {
  const t = useTranslations("admin");
  const [log, setLog] = useState(initialLog);
  const [isPending, startTransition] = useTransition();

  function loadPage(page: number) {
    startTransition(async () => {
      const data = await getAuditLog(page);
      setLog(data);
    });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            {t("auditLog")}
            <Badge variant="outline" className="ml-auto">
              {log.total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("date")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("admin")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("action")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("target")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("details")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {log.logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      {t("noAuditLogs")}
                    </td>
                  </tr>
                )}
                {log.logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {entry.adminName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        className={
                          actionColors[entry.action] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-xs text-muted-foreground">
                        {entry.targetType}
                      </span>
                      <span className="ml-1 text-xs font-mono">
                        {entry.targetId.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {entry.details ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {JSON.stringify(entry.details).slice(0, 60)}
                        </code>
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {log.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={log.page <= 1 || isPending}
            onClick={() => loadPage(log.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {log.page} of {log.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={log.page >= log.totalPages || isPending}
            onClick={() => loadPage(log.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
