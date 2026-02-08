import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Globe,
  Video,
  Users,
  GraduationCap,
  Clock,
  Shield,
  Heart,
  Sparkles,
  Layers,
  Palette,
  Workflow,
  Wrench,
  RefreshCw,
  MessageCircle,
  Briefcase,
  Share2,
  Dumbbell,
  ArrowRight,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODULE_ICONS = [
  BookOpen, Shield, Wrench, Sparkles, Layers, Palette,
  Workflow, RefreshCw, Heart, Briefcase, Share2, Dumbbell,
];

export default async function LandingPage() {
  const t = await getTranslations("landing");

  const modules = MODULE_ICONS.map((icon, i) => ({
    number: i + 1,
    icon,
    title: t(`mod${i + 1}`),
  }));

  const stats = [
    { icon: BookOpen, label: t("modules") },
    { icon: ClipboardCheck, label: t("quizzes") },
    { icon: Award, label: t("certificate") },
    { icon: Globe, label: t("bilingual") },
    { icon: Video, label: t("liveSupport") },
    { icon: Users, label: t("affiliateProgram") },
  ];

  const whyCards = [
    {
      icon: GraduationCap,
      title: t("why1Title"),
      description: t("why1Desc"),
    },
    {
      icon: Clock,
      title: t("why2Title"),
      description: t("why2Desc"),
    },
    {
      icon: Award,
      title: t("why3Title"),
      description: t("why3Desc"),
    },
    {
      icon: MessageCircle,
      title: t("why4Title"),
      description: t("why4Desc"),
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-light/30 via-white to-rose-light/30" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 border-gold/30 bg-gold/10 px-4 py-1.5 text-gold-dark"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {t("profCertification")}
            </Badge>

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("hero")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("heroSub")}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-full bg-gold px-8 text-base font-semibold text-white shadow-lg shadow-gold/25 transition-all hover:bg-gold-dark hover:shadow-xl hover:shadow-gold/30"
              >
                <Link href="/enroll">
                  {t("enrollCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full px-8 text-base"
              >
                <Link href="#modules">
                  {t("learnMore")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto pb-2 sm:pb-0 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-shrink-0 flex-col items-center gap-2 px-3 py-2 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                  <stat.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Section ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("whyTitle")}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {whyCards.map((card) => (
            <Card
              key={card.title}
              className="group border-transparent bg-muted/50 shadow-none transition-all hover:border-gold/20 hover:bg-white hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 transition-colors group-hover:bg-gold/20">
                  <card.icon className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Modules Preview ─── */}
      <section
        id="modules"
        className="border-t bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("modulesTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("modulesDesc")}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((mod) => (
              <div
                key={mod.number}
                className={cn(
                  "stagger-item group relative overflow-hidden rounded-xl border bg-white p-5",
                  "transition-all hover:border-gold/30 hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gold/10 text-sm font-bold text-gold transition-colors group-hover:bg-gold group-hover:text-white">
                    {mod.number}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
                      {mod.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}

            {/* Bonus module card */}
            <div
              className={cn(
                "stagger-item group relative overflow-hidden rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-5",
                "transition-all hover:border-gold/60 hover:bg-gold/10"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gold/20 transition-colors group-hover:bg-gold group-hover:text-white">
                  <Star className="h-5 w-5 text-gold group-hover:text-white" />
                </div>
                <div className="min-w-0">
                  <Badge className="mb-1.5 bg-gold/20 text-gold-dark hover:bg-gold/30">
                    {t("bonusTitle")}
                  </Badge>
                  <h3 className="text-sm font-semibold leading-snug text-foreground">
                    {t("bonusDesc")}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-rose/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("ctaSub")}
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-full bg-gold px-10 text-base font-semibold text-white shadow-lg shadow-gold/25 transition-all hover:bg-gold-dark hover:shadow-xl hover:shadow-gold/30"
              >
                <Link href="/enroll">
                  {t("enrollCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
