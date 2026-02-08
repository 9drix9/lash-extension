import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getActiveCourse } from "@/lib/actions/enrollment";
import { hasActivePayment } from "@/lib/actions/payment";
import { auth } from "@/lib/auth";
import { getLocalizedField } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Globe,
  Video,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { CheckoutButton } from "./enroll-button";

const INSTALLMENT_COUNT = 3;

export default async function EnrollPage() {
  const t = await getTranslations("common");
  const tLanding = await getTranslations("landing");
  const tPayment = await getTranslations("payment");
  const session = await auth();
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "es" ? "es" : "en";

  const course = await getActiveCourse();

  // If the user is signed in, check whether they already have an active payment
  if (session?.user && course) {
    const paid = await hasActivePayment(session.user.id, course.id);
    if (paid) {
      redirect("/dashboard");
    }
  }

  if (!course) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {tLanding("noCourseAvailable")}
            </CardTitle>
            <CardDescription>
              {tLanding("noCourseDesc")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalPrice = course.price; // in cents
  const installmentTotal = totalPrice + 8000; // $80 surcharge in cents
  const monthlyPrice = Math.ceil(installmentTotal / INSTALLMENT_COUNT);
  const savings = (installmentTotal - totalPrice) / 100; // savings in dollars
  const moduleCount = course.modules.length;
  const lessonCount = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.length,
    0
  );
  const quizCount = course.modules.filter((mod) => mod.quiz).length;

  const features = [
    { icon: BookOpen, label: tLanding("modulesCount", { count: moduleCount }) },
    { icon: ClipboardCheck, label: tLanding("quizzesCount", { count: quizCount }) },
    { icon: Award, label: tLanding("certificate") },
    { icon: Globe, label: tLanding("bilingual") },
    { icon: Video, label: tLanding("liveSupport") },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-rose/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
            <Sparkles className="h-7 w-7 text-gold" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            {getLocalizedField(course, "title", locale)}
          </h1>
          {getLocalizedField(course, "subtitle", locale) && (
            <p className="text-base text-muted-foreground">
              {getLocalizedField(course, "subtitle", locale)}
            </p>
          )}
        </div>

        {/* What's included */}
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {tLanding("whatsIncluded")}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold/10">
                      <feature.icon className="h-4 w-4 text-gold" />
                    </div>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-muted/60 p-4">
              <ul className="space-y-2">
                {[
                  tLanding("videoLessons", { count: lessonCount }),
                  tLanding("selfPaced"),
                  tLanding("certificateCompletion"),
                  tLanding("lifetimeAccess"),
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Pay in Full */}
          <Card className="relative flex flex-col overflow-hidden border-border/50 shadow-xl shadow-black/5">
            <div className="h-1.5 w-full bg-gradient-to-r from-gold via-gold-light to-gold" />
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center gap-2">
                <Badge className="bg-gold/10 text-gold hover:bg-gold/10 px-3">
                  {tPayment("bestValue")}
                </Badge>
                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 px-3">
                  {tPayment("saveAmount", { amount: savings.toFixed(0) })}
                </Badge>
              </div>
              <CardTitle className="font-display text-xl">
                {tPayment("payInFull")}
              </CardTitle>
              <CardDescription>{tPayment("oneTimeDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  ${(totalPrice / 100).toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex-col gap-3 pt-6 pb-6">
              <CheckoutButton
                courseId={course.id}
                isSignedIn={!!session?.user}
                paymentType="ONE_TIME"
                label={tPayment("payInFull")}
              />
              <p className="text-center text-xs text-muted-foreground">
                {tLanding("secureCheckout")}
              </p>
            </CardFooter>
          </Card>

          {/* Payment Plan */}
          <Card className="relative flex flex-col overflow-hidden border-border/50 shadow-xl shadow-black/5">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose via-rose/70 to-rose" />
            <CardHeader className="text-center space-y-2">
              <Badge className="mx-auto bg-rose/10 text-rose hover:bg-rose/10 px-3">
                {tPayment("paymentPlan")}
              </Badge>
              <CardTitle className="font-display text-xl">
                {tPayment("paymentPlan")}
              </CardTitle>
              <CardDescription>{tPayment("installmentDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    ${(monthlyPrice / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{tPayment("perMonth")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {INSTALLMENT_COUNT} {tPayment("months")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tPayment("totalCost", { amount: (installmentTotal / 100).toFixed(0) })}
                </p>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex-col gap-3 pt-6 pb-6">
              <CheckoutButton
                courseId={course.id}
                isSignedIn={!!session?.user}
                paymentType="INSTALLMENT"
                label={tPayment("selectPlan")}
                variant="outline"
              />
              <p className="text-center text-xs text-muted-foreground">
                {tLanding("secureCheckout")}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
