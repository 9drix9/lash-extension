"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, UserX } from "lucide-react";

interface RemovedStudent {
  id: string;
  name: string;
  email: string;
  enrolledAt: string | null;
  removedAt: string;
  paymentStatus: string | null;
  certificates: number;
}

interface RemovedStudentsClientProps {
  students: RemovedStudent[];
}

export function RemovedStudentsClient({ students }: RemovedStudentsClientProps) {
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

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
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserX className="h-5 w-5 text-red-500" />
            Removed Students
          </CardTitle>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Enrolled</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Removed</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Certificates</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No removed students found.
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
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(student.enrolledAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-red-600">{formatDate(student.removedAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {student.paymentStatus ? (
                      <Badge variant={student.paymentStatus === "CANCELLED" ? "secondary" : "outline"}>
                        {student.paymentStatus}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {student.certificates}
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
