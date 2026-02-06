import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAffiliates } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { AffiliatesClient } from "./affiliates-client";

export default async function AffiliatesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const affiliates = await getAffiliates();

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        select: {
          code: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const affiliatesData = affiliates.map((aff) => ({
    id: aff.id,
    userName: aff.user.name || aff.user.email || "Unknown",
    userEmail: aff.user.email || "",
    code: aff.code,
    status: aff.status as "PENDING" | "APPROVED" | "REJECTED",
    commissionRate: aff.commissionRate,
    clicks: aff._count.clicks,
    conversions: aff._count.conversions,
    totalCommission: aff.conversions.reduce(
      (sum, c) => sum + c.commission,
      0
    ),
  }));

  const payoutsData = payouts.map((p) => ({
    id: p.id,
    affiliateId: p.affiliateId,
    affiliateCode: p.affiliate.code,
    affiliateName: p.affiliate.user.name || p.affiliate.user.email || "Unknown",
    amount: p.amount,
    status: p.status as "PENDING" | "PAID",
    paidAt: p.paidAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("title")}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("affiliates")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {affiliatesData.length} affiliates total
          </p>
        </div>

        <AffiliatesClient affiliates={affiliatesData} payouts={payoutsData} />
      </div>
    </div>
  );
}
