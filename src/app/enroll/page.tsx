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
  CheckCircle2,
  XCircle,
  Sparkles,
  Crown,
  Video,
  BookOpen,
  Award,
  Users,
  BookMarked,
  Star,
  MessageSquare,
  Palette,
  Share2,
} from "lucide-react";
import { CheckoutButton } from "./enroll-button";

export default async function EnrollPage() {
  const t = await getTranslations("common");
  const tLanding = await getTranslations("landing");
  const tPayment = await getTranslations("payment");
  const session = await auth();
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "es" ? "es" : "en";

  const course = await getActiveCourse();

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
            <CardDescription>{tLanding("noCourseDesc")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Tier feature lists
  const basicFeatures = [
    { icon: Video,      label: tPayment("tierSelfPaced"),       included: true },
    { icon: BookOpen,   label: tPayment("tierLessonsQuizzes"),   included: true },
    { icon: Award,      label: tPayment("tierLifetimeAccess"),   included: true },
    { icon: Users,      label: tPayment("tierLiveSeminars"),     included: false },
    { icon: MessageSquare, label: tPayment("tierCoaching"),      included: false },
  ];

  const standardFeatures = [
    { icon: Video,      label: tPayment("tierSelfPaced"),        included: true },
    { icon: BookOpen,   label: tPayment("tierLessonsQuizzes"),   included: true },
    { icon: Award,      label: tPayment("tierLifetimeAccess"),   included: true },
    { icon: Users,      label: tPayment("tierLiveSeminars"),     included: true },
    { icon: BookMarked, label: tPayment("tierMappingEbook"),     included: true },
    { icon: MessageSquare, label: tPayment("tierCoaching"),      included: false },
  ];

  const premiumFeatures = [
    { icon: Video,      label: tPayment("tierSelfPaced"),          included: true },
    { icon: BookOpen,   label: tPayment("tierLessonsQuizzes"),     included: true },
    { icon: Award,      label: tPayment("tierLifetimeAccess"),     included: true },
    { icon: Users,      label: tPayment("tierLiveSeminars"),       included: true },
    { icon: BookMarked, label: tPayment("tierMappingEbook"),       included: true },
    { icon: Star,       label: tPayment("tierPersonalizedFeedback"), included: true },
    { icon: MessageSquare, label: tPayment("tierCoaching"),        included: true },
    { icon: Palette,    label: tPayment("tierBonusTemplates"),     included: true },
    { icon: Share2,     label: tPayment("tierMarketingToolkit"),   included: true },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            {getLocalizedField(course, "title", locale)}
          </h1>
          {getLocalizedField(course, "subtitle", locale) && (
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              {getLocalizedField(course, "subtitle", locale)}
            </p>
          )}
        </div>

        {/* Intro Video */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h2 className="text-center text-lg font-semibold">
            {tPayment("introVideo")}
          </h2>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/VIDEO_ID_HERE"
              title={tPayment("introVideo")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ── BASIC ── */}
          <Card className="relative flex flex-col overflow-hidden border-border/50 shadow-lg shadow-black/5">
            <div className="h-1.5 w-full bg-muted" />
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="font-display text-xl">
                {tPayment("tierBasicName")}
              </CardTitle>
              <CardDescription className="text-sm">
                {tPayment("tierBasicDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold">$497</span>
                  <span className="text-sm text-muted-foreground">USD</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tPayment("tierLifetimeAccess")}
                </p>
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2.5">
                {basicFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/60 line-through"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <Separator />
            <CardFooter className="flex-col gap-3 pt-6 pb-6">
              <CheckoutButton
                courseId={course.id}
                isSignedIn={!!session?.user}
                tier="BASIC"
                label={tPayment("tierEnrollBasic")}
                variant="outline"
              />
              <p className="text-center text-xs text-muted-foreground">
                {tLanding("secureCheckout")}
              </p>
            </CardFooter>
          </Card>

          {/* ── STANDARD (Most Popular) ── */}
          <Card className="relative flex flex-col overflow-hidden border-primary shadow-xl shadow-primary/10 scale-[1.02]">
            <div className="h-1.5 w-full bg-primary" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground px-3 text-xs font-semibold">
                {tPayment("tierMostPopular")}
              </Badge>
            </div>
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="font-display text-xl">
                {tPayment("tierStandardName")}
              </CardTitle>
              <CardDescription className="text-sm">
                {tPayment("tierStandardDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-primary">$797</span>
                  <span className="text-sm text-muted-foreground">USD</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tPayment("tierLifetimeAccess")}
                </p>
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2.5">
                {standardFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/60 line-through"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <Separator />
            <CardFooter className="flex-col gap-3 pt-6 pb-6">
              <CheckoutButton
                courseId={course.id}
                isSignedIn={!!session?.user}
                tier="STANDARD"
                label={tPayment("tierEnrollStandard")}
                variant="default"
              />
              <p className="text-center text-xs text-muted-foreground">
                {tLanding("secureCheckout")}
              </p>
            </CardFooter>
          </Card>

          {/* ── PREMIUM / VIP ── */}
          <Card className="relative flex flex-col overflow-hidden border-gold/60 shadow-xl shadow-gold/10">
            <div className="h-1.5 w-full bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-gold text-white hover:bg-gold px-3 text-xs font-semibold gap-1">
                <Crown className="h-3 w-3" />
                {tPayment("tierVip")}
              </Badge>
            </div>
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="font-display text-xl">
                {tPayment("tierPremiumName")}
              </CardTitle>
              <CardDescription className="text-sm">
                {tPayment("tierPremiumDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-gold">$1,297</span>
                  <span className="text-sm text-muted-foreground">USD</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tPayment("tierLifetimeAccess")}
                </p>
              </div>

              <Separator />

              {/* Features */}
              <ul className="space-y-2.5">
                {premiumFeatures.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gold" />
                    <span className="text-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>

              {/* Tagline */}
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;{tPayment("tierPremiumTagline")}&rdquo;
                </p>
              </div>
            </CardContent>

            <Separator />
            <CardFooter className="flex-col gap-3 pt-6 pb-6">
              <CheckoutButton
                courseId={course.id}
                isSignedIn={!!session?.user}
                tier="PREMIUM"
                label={tPayment("tierEnrollPremium")}
                variant="premium"
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
