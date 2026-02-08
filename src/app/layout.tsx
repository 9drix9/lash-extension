import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import { getActiveCourse } from "@/lib/actions/enrollment";
import { hasActivePayment } from "@/lib/actions/payment";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Lash Extension Academy",
  description:
    "Master the art of lash extensions with our comprehensive certification course.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const session = await auth();
  let isPaid = false;
  if (session?.user) {
    const course = await getActiveCourse();
    if (course) {
      isPaid = await hasActivePayment(session.user.id, course.id);
    }
  }

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <Navbar isPaid={isPaid} />
            <main>{children}</main>
            <Footer />
            <Toaster position="top-center" richColors />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
