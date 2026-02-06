import { NextRequest, NextResponse } from "next/server";
import { updateVideoProgress } from "@/lib/actions/progress";

export async function POST(request: NextRequest) {
  try {
    const { lessonId, watchedPercent } = await request.json();

    if (!lessonId || typeof watchedPercent !== "number") {
      return NextResponse.json(
        { error: "Missing lessonId or watchedPercent" },
        { status: 400 }
      );
    }

    await updateVideoProgress(lessonId, watchedPercent);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
