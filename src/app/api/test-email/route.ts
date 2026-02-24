import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "flamingeosbusiness@gmail.com",
      subject: "Test Email — Lash Extension Academy",
      html: "<h2>It works! 🎉</h2><p>Resend is connected and sending correctly.</p>",
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
