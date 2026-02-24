import { NextResponse } from "next/server";
import { sendEnrollmentConfirmation } from "@/lib/email";

export async function GET() {
  try {
    await sendEnrollmentConfirmation({
      to: "flamingeosbusiness@gmail.com",
      name: "Test Student",
      tier: "PREMIUM",
      dashboardUrl: "https://course.iblfbeauty.com/dashboard",
    });

    return NextResponse.json({ success: true, message: "Test email sent!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
