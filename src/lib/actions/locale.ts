"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function setLocale(locale: string) {
  const validLocale = locale === "es" ? "es" : "en";

  const cookieStore = await cookies();
  cookieStore.set("locale", validLocale, {
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });

  // Update user profile if logged in
  const session = await auth();
  if (session?.user) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: validLocale },
    });
  }
}
