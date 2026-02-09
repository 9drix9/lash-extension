"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";

interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userId: string;
  courseName: string;
  courseNameEs: string;
  paymentType: string;
  status: string;
  amountTotal: number;
  amountPaid: number;
  installmentsTotal: number;
  installmentsPaid: number;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsClientProps {
  transactions: Transaction[];
}

type SortKey = "userName" | "createdAt" | "amountTotal" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "PAST_DUE";

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let list = transactions;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.userName.toLowerCase().includes(q) ||
          tx.userEmail.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((tx) => tx.status === statusFilter);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "userName") cmp = a.userName.localeCompare(b.userName);
      else if (sortKey === "createdAt")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === "amountTotal") cmp = a.amountTotal - b.amountTotal;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [transactions, search, statusFilter, sortKey, sortDir]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCents(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            {t("txCompleted")}
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            {t("txActive")}
          </Badge>
        );
      case "PENDING":
        return <Badge variant="secondary">{t("txPending")}</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">{t("txCancelled")}</Badge>;
      case "PAST_DUE":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            {t("txPastDue")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const typeBadge = (type: string) => {
    if (type === "ONE_TIME") {
      return <Badge variant="outline">{t("txOneTime")}</Badge>;
    }
    return (
      <Badge variant="outline" className="border-purple-300 text-purple-700">
        {t("txInstallment")}
      </Badge>
    );
  };

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "ACTIVE", label: t("txActive") },
    { key: "COMPLETED", label: t("txCompleted") },
    { key: "PENDING", label: t("txPending") },
    { key: "CANCELLED", label: t("txCancelled") },
    { key: "PAST_DUE", label: t("txPastDue") },
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
        <CardTitle className="text-lg">{t("transactions")}</CardTitle>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchTransactions")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortHeader label={t("name")} sortKeyVal="userName" />
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("email")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("txType")}
                </th>
                <SortHeader label={t("txAmount")} sortKeyVal="amountTotal" />
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("txPaid")}
                </th>
                <SortHeader label={t("status")} sortKeyVal="status" />
                <SortHeader label={t("txDate")} sortKeyVal="createdAt" />
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {t("noTransactions")}
                  </td>
                </tr>
              )}
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">
                    <Link
                      href={`/admin/students/${tx.userId}`}
                      className="text-primary hover:underline"
                    >
                      {tx.userName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tx.userEmail}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {typeBadge(tx.paymentType)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCents(tx.amountTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatCents(tx.amountPaid)}
                    {tx.paymentType === "INSTALLMENT" && (
                      <span className="ml-1 text-xs">
                        ({tx.installmentsPaid}/{tx.installmentsTotal})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {statusBadge(tx.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/students/${tx.userId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("viewProfile")}
                    </Link>
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
