import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const TIER_PRICES: Record<string, { amount: number; label: string; desc: string }> = {
  BASIC:    { amount: 49700,  label: "Basic",           desc: "Self-paced learning — lifetime access" },
  STANDARD: { amount: 79700,  label: "Standard",        desc: "Lessons + live seminars + Mapping Ebook" },
  PREMIUM:  { amount: 129700, label: "VIP Masterclass", desc: "Everything + 1-on-1 coaching + marketing toolkit" },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, tier } = await req.json();

  if (!courseId || !TIER_PRICES[tier]) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check for existing active payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
  });
  if (existingPayment) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";

  const { amount, label, desc } = TIER_PRICES[tier];

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${course.titleEn} — ${label}`,
              description: desc,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        courseId,
        paymentType: "ONE_TIME",
        tier,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/enroll`,
    });

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        stripeSessionId: checkoutSession.id,
        paymentType: "ONE_TIME",
        tier,
        status: "PENDING",
        amountTotal: amount,
        installmentsTotal: 1,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
