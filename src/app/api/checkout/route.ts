import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const INSTALLMENT_COUNT = 3;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, paymentType } = await req.json();

  if (!courseId || !["ONE_TIME", "INSTALLMENT"].includes(paymentType)) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const totalPrice = course.price; // in cents

  if (paymentType === "ONE_TIME") {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.titleEn,
              description: "Full access — one-time payment",
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        courseId,
        paymentType: "ONE_TIME",
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
        status: "PENDING",
        amountTotal: totalPrice,
        installmentsTotal: 1,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  // INSTALLMENT — subscription mode
  const monthlyPrice = Math.ceil(totalPrice / INSTALLMENT_COUNT);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.titleEn,
            description: `Payment plan — ${INSTALLMENT_COUNT} monthly payments`,
          },
          unit_amount: monthlyPrice,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId: session.user.id,
        courseId,
        paymentType: "INSTALLMENT",
        installmentsTotal: String(INSTALLMENT_COUNT),
      },
    },
    metadata: {
      userId: session.user.id,
      courseId,
      paymentType: "INSTALLMENT",
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/enroll`,
  });

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      courseId,
      stripeSessionId: checkoutSession.id,
      paymentType: "INSTALLMENT",
      status: "PENDING",
      amountTotal: totalPrice,
      installmentsTotal: INSTALLMENT_COUNT,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
