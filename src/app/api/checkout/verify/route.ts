import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { initializeModuleProgress } from "@/lib/actions/progress";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  // Look up the payment record
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Ensure the payment belongs to the current user
  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If already active/completed, nothing to do
  if (payment.status === "ACTIVE" || payment.status === "COMPLETED") {
    return NextResponse.json({ verified: true });
  }

  // Verify with Stripe that the checkout session is actually paid
  try {
    const checkoutSession =
      await getStripe().checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ verified: false, status: "unpaid" });
    }

    // Update payment status
    if (payment.paymentType === "ONE_TIME") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          amountPaid: payment.amountTotal,
          installmentsPaid: 1,
          stripeCustomerId: checkoutSession.customer as string | null,
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "ACTIVE",
          amountPaid: Math.ceil(
            payment.amountTotal / payment.installmentsTotal
          ),
          installmentsPaid: 1,
          stripeCustomerId: checkoutSession.customer as string | null,
          stripeSubscriptionId: checkoutSession.subscription as string | null,
        },
      });
    }

    // Enroll the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { enrolledAt: new Date() },
    });
    await initializeModuleProgress(session.user.id, payment.courseId);

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Stripe session verify error:", err);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
