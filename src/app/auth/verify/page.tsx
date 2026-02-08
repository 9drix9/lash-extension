import { getTranslations } from "next-intl/server";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function VerifyPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-rose/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/50 text-center shadow-xl shadow-black/5">
        <CardHeader className="space-y-4 pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <Mail className="h-8 w-8 text-gold" />
          </div>
          <CardTitle className="font-display text-2xl">
            {t("checkEmail")}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {t("checkEmailDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          <div className="rounded-lg bg-muted/60 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t("linkExpiry")}
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/auth/signin">
              <ArrowLeft className="h-4 w-4" />
              {t("backToSignIn")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
