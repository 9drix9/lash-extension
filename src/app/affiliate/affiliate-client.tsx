"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { applyForAffiliate } from "@/lib/actions/affiliate";
import { toast } from "sonner";

interface Stats {
  affiliate: {
    id: string;
    code: string;
    status: string;
    commissionRate: number;
  };
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  totalPaid: number;
  balance: number;
}

interface Props {
  isLoggedIn: boolean;
  stats: Stats | null;
}

export function AffiliateClient({ isLoggedIn, stats }: Props) {
  const t = useTranslations("affiliatePublic");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(!!stats);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyForAffiliate();
      setApplied(true);
      toast.success(t("applicationSubmitted"));
    } catch {
      toast.error(t("failedApply"));
    } finally {
      setApplying(false);
    }
  };

  const handleCopyLink = () => {
    if (!stats) return;
    const link = `${appUrl}/api/affiliate/track?ref=${stats.affiliate.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("linkCopied"));
  };

  if (!isLoggedIn) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <p className="text-muted-foreground mb-4">
            {t("signInToApply")}
          </p>
          <Link href="/auth/signin">
            <Button>{t("apply")}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!stats && !applied) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <Button onClick={handleApply} disabled={applying} size="lg">
            {applying ? "..." : t("apply")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">{t("applied")}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t("applicationReview")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("yourDashboard")}</CardTitle>
            <Badge
              className={
                stats.affiliate.status === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : stats.affiliate.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }
            >
              {stats.affiliate.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stats.affiliate.status === "APPROVED" && (
            <>
              {/* Referral Link */}
              <div className="bg-muted rounded-lg p-3 mb-6">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("yourReferralLink")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm flex-1 truncate">
                    {appUrl}/api/affiliate/track?ref={stats.affiliate.code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                  <p className="text-xs text-muted-foreground">{t("clicks")}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalConversions}</p>
                  <p className="text-xs text-muted-foreground">{t("conversions")}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    ${(stats.totalCommission / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("totalEarned")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    ${(stats.balance / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("balance")}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t("commissionRate", { rate: stats.affiliate.commissionRate })}
              </p>
            </>
          )}

          {stats.affiliate.status === "PENDING" && (
            <p className="text-center text-muted-foreground">
              {t("pendingReview")}
</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
