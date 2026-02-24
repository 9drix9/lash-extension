import { NextResponse } from "next/server";
import { sendEnrollmentConfirmation, sendPaymentReceipt } from "@/lib/email";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=youremail@gmail.com" }, { status: 400 });
  }

  try {
    await sendEnrollmentConfirmation({
      to,
      name: "Test Student",
      tier: "PREMIUM",
    });

    await sendPaymentReceipt({
      to,
      name: "Test Student",
      tier: "PREMIUM",
      amountPaid: 129700,
    });

    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
