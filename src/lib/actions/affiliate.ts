"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function applyForAffiliate() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) return existing;

  // Generate unique code
  const code = `REF-${session.user.name?.replace(/\s/g, "").slice(0, 6).toUpperCase() || "USER"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const affiliate = await prisma.affiliate.create({
    data: {
      userId: session.user.id,
      code,
    },
  });

  return affiliate;
}

export async function trackAffiliateClick(code: string, ip?: string, userAgent?: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { code, status: "APPROVED" },
  });

  if (!affiliate) return;

  await prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      ip,
      userAgent,
    },
  });
}

export async function getAffiliateStats() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          clicks: true,
          conversions: true,
        },
      },
      conversions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!affiliate) return null;

  const totalCommission = await prisma.affiliateConversion.aggregate({
    where: { affiliateId: affiliate.id },
    _sum: { commission: true },
  });

  const totalPaid = await prisma.payout.aggregate({
    where: { affiliateId: affiliate.id, status: "PAID" },
    _sum: { amount: true },
  });

  return {
    affiliate,
    totalClicks: affiliate._count.clicks,
    totalConversions: affiliate._count.conversions,
    totalCommission: totalCommission._sum.commission || 0,
    totalPaid: totalPaid._sum.amount || 0,
    balance: (totalCommission._sum.commission || 0) - (totalPaid._sum.amount || 0),
  };
}
