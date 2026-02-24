import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { initializeModuleProgress } from "@/lib/actions/progress";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, courseId, paymentType, tier = "BASIC" } = session.metadata || {};

      if (!userId || !courseId) break;

      const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: session.id },
      });
      if (!payment) break;

      if (paymentType === "ONE_TIME") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            amountPaid: payment.amountTotal,
            installmentsPaid: 1,
            stripeCustomerId: session.customer as string | null,
          },
        });
      } else {
        // INSTALLMENT — first payment of subscription
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "ACTIVE",
            amountPaid: Math.ceil(payment.amountTotal / payment.installmentsTotal),
            installmentsPaid: 1,
            stripeCustomerId: session.customer as string | null,
            stripeSubscriptionId: session.subscription as string | null,
          },
        });
      }

      // Enroll the user
      await prisma.user.update({
        where: { id: userId },
        data: { enrolledAt: new Date() },
      });
      await initializeModuleProgress(userId, courseId, tier);

      // Track affiliate conversion
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.referralCode) {
        const affiliate = await prisma.affiliate.findUnique({
          where: { code: user.referralCode, status: "APPROVED" },
        });
        if (affiliate && affiliate.userId !== userId) {
          const amount = payment.amountTotal;
          const commission = Math.round(
            amount * (affiliate.commissionRate / 100)
          );
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliate.id,
              email: user.email,
              amount,
              commission,
            },
          });
        }
      }

      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!subscriptionId) break;

      const payment = await prisma.payment.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (!payment || payment.paymentType !== "INSTALLMENT") break;

      // Skip the first invoice — already handled by checkout.session.completed
      if (payment.installmentsPaid === 0) break;

      const newPaid = payment.installmentsPaid + 1;
      const perInstallment = Math.ceil(
        payment.amountTotal / payment.installmentsTotal
      );
      const newAmountPaid = Math.min(
        payment.amountPaid + perInstallment,
        payment.amountTotal
      );

      if (newPaid >= payment.installmentsTotal) {
        // All installments paid — complete and cancel subscription
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            installmentsPaid: newPaid,
            amountPaid: payment.amountTotal,
          },
        });
        // Cancel the subscription since all payments are made
        try {
          await getStripe().subscriptions.cancel(subscriptionId);
        } catch (err) {
          console.error("Failed to cancel completed subscription:", err);
        }
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            installmentsPaid: newPaid,
            amountPaid: newAmountPaid,
          },
        });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const payment = await prisma.payment.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!payment) break;

      // Only cancel if not fully paid
      if (payment.installmentsPaid < payment.installmentsTotal) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "CANCELLED" },
        });
      }

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!subscriptionId) break;

      const payment = await prisma.payment.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (!payment) break;

      if (payment.installmentsPaid < payment.installmentsTotal) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAST_DUE" },
        });
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
