import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getActiveCourse } from "@/lib/actions/enrollment";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { EnrollButton } from "./enroll-button";

export default async function EnrollPage() {
  const t = await getTranslations("common");
  const tLanding = await getTranslations("landing");
  const session = await auth();
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "es" ? "es" : "en";

  // If the user is signed in, check whether they are already enrolled
  if (session?.user) {
    const existingProgress = await prisma.moduleProgress.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (existingProgress) {
      redirect("/dashboard");
    }
  }

  const course = await getActiveCourse();

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

  const isFree = !course.price || course.price === 0;
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

      <Card className="relative w-full max-w-lg overflow-hidden border-border/50 shadow-xl shadow-black/5">
        {/* Decorative top border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-gold via-gold-light to-gold" />

        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
            <Sparkles className="h-7 w-7 text-gold" />
          </div>

          <div>
            <CardTitle className="font-display text-2xl sm:text-3xl">
              {getLocalizedField(course, "title", locale)}
            </CardTitle>
            {getLocalizedField(course, "subtitle", locale) && (
              <CardDescription className="mt-2 text-base">
                {getLocalizedField(course, "subtitle", locale)}
              </CardDescription>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-center gap-3">
            {isFree ? (
              <Badge className="bg-emerald-100 px-4 py-1.5 text-base font-semibold text-emerald-700 hover:bg-emerald-100">
                {t("free")}
              </Badge>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  ${course.price}
                </span>
                <span className="text-sm text-muted-foreground">USD</span>
              </div>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          {/* What's included */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {tLanding("whatsIncluded")}
            </h3>
            <ul className="space-y-3">
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

          {/* Highlights */}
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

        <CardFooter className="flex-col gap-3 pb-6">
          <EnrollButton
            courseId={course.id}
            isSignedIn={!!session?.user}
            label={t("enroll")}
          />
          <p className="text-center text-xs text-muted-foreground">
            {isFree
              ? tLanding("noCreditCard")
              : tLanding("secureCheckout")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
