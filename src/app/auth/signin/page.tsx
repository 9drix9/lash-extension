"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setError(tCommon("error"));
        setIsLoading(false);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError(tCommon("error"));
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-rose/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/50 shadow-xl shadow-black/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <Sparkles className="h-6 w-6 text-gold" />
          </div>
          <CardTitle className="font-display text-2xl">
            {t("signInTitle")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("signInDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(
                    "h-11 pl-10",
                    "focus-visible:ring-gold/50"
                  )}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="h-11 w-full gap-2 bg-gold text-white shadow-md shadow-gold/20 hover:bg-gold-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                <>
                  {t("magicLink")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            No password needed. We&apos;ll send a secure sign-in link to your
            email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
