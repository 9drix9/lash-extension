"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  updateAffiliateStatus,
  createPayout,
  markPayoutPaid,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AffiliateData {
  id: string;
  userName: string;
  userEmail: string;
  code: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  commissionRate: number;
  clicks: number;
  conversions: number;
  totalCommission: number;
}

interface PayoutData {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt: string | null;
  createdAt: string;
}

interface AffiliatesClientProps {
  affiliates: AffiliateData[];
  payouts: PayoutData[];
}

export function AffiliatesClient({
  affiliates,
  payouts,
}: AffiliatesClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [showPayouts, setShowPayouts] = useState(false);

  function handleStatusChange(
    affiliateId: string,
    status: "APPROVED" | "REJECTED",
    commissionRate?: number
  ) {
    startTransition(async () => {
      try {
        await updateAffiliateStatus(affiliateId, status, commissionRate);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleCreatePayout(affiliateId: string, formData: FormData) {
    startTransition(async () => {
      try {
        const amount = Math.round(
          parseFloat(formData.get("amount") as string) * 100
        );
        await createPayout(affiliateId, amount);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function handleMarkPaid(payoutId: string) {
    startTransition(async () => {
      try {
        await markPayoutPaid(payoutId);
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      }
    });
  }

  function exportCsv() {
    const headers = [
      "Name",
      "Email",
      "Code",
      "Status",
      "Commission Rate (%)",
      "Clicks",
      "Conversions",
      "Total Commission ($)",
    ];
    const rows = affiliates.map((a) => [
      a.userName,
      a.userEmail,
      a.code,
      a.status,
      a.commissionRate.toString(),
      a.clicks.toString(),
      a.conversions.toString(),
      (a.totalCommission / 100).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `affiliates-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function formatCents(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default" as const;
      case "REJECTED":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          {t("exportCsv")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPayouts(!showPayouts)}
        >
          {showPayouts ? "Show Affiliates" : t("payouts")} (
          {payouts.filter((p) => p.status === "PENDING").length} pending)
        </Button>
      </div>

      {!showPayouts ? (
        /* Affiliates Table */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("affiliates")}</CardTitle>
            <CardDescription>
              {affiliates.length} affiliates registered
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Affiliate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Code
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Clicks
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Conv.
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {t("commission")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {affiliates.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No affiliates found.
                      </td>
                    </tr>
                  )}
                  {affiliates.map((aff) => (
                    <tr key={aff.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{aff.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {aff.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {aff.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusVariant(aff.status)}>
                          {aff.status === "APPROVED"
                            ? t("approved")
                            : aff.status === "REJECTED"
                            ? t("rejected")
                            : t("pending")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {aff.commissionRate}%
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {aff.clicks}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {aff.conversions}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {formatCents(aff.totalCommission)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {aff.status === "PENDING" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  handleStatusChange(aff.id, "APPROVED")
                                }
                              >
                                {t("approved")}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  handleStatusChange(aff.id, "REJECTED")
                                }
                              >
                                {t("rejected")}
                              </Button>
                            </>
                          )}
                          {aff.status === "APPROVED" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Payout
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create Payout</DialogTitle>
                                  <DialogDescription>
                                    Create a payout for {aff.userName} (
                                    {aff.code}). Total earned:{" "}
                                    {formatCents(aff.totalCommission)}
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreatePayout(
                                      aff.id,
                                      new FormData(e.currentTarget)
                                    );
                                  }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor={`payout-${aff.id}`}>
                                      Amount ($)
                                    </Label>
                                    <Input
                                      id={`payout-${aff.id}`}
                                      name="amount"
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      required
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button" variant="outline">
                                        {tc("cancel")}
                                      </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isPending}>
                                      {isPending
                                        ? tc("loading")
                                        : t("create")}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                          {aff.status === "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                handleStatusChange(aff.id, "APPROVED")
                              }
                            >
                              Re-approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Payouts Table */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("payouts")}</CardTitle>
            <CardDescription>
              {payouts.length} payouts total,{" "}
              {payouts.filter((p) => p.status === "PENDING").length} pending
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Affiliate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Code
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Paid At
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payouts.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No payouts found.
                      </td>
                    </tr>
                  )}
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">
                        {payout.affiliateName}
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {payout.affiliateCode}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {formatCents(payout.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            payout.status === "PAID" ? "default" : "secondary"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {payout.paidAt ? formatDate(payout.paidAt) : "--"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payout.status === "PENDING" && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleMarkPaid(payout.id)}
                          >
                            {t("markPaid")}
                          </Button>
                        )}
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
