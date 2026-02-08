"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const t = useTranslations("payment");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!sessionId) {
      setVerifying(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        setVerified(data.verified === true);
      } catch {
        // Even if verify fails, the webhook will eventually handle it
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [sessionId]);

  useEffect(() => {
    if (verifying || !verified) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifying, verified, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            {verifying ? (
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            )}
          </div>
          <CardTitle className="font-display text-2xl">
            {verifying ? t("verifyingPayment") : t("checkoutSuccess")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {verifying
              ? t("pleaseWait")
              : t("redirectingCountdown", { seconds: countdown })}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            asChild
            className="bg-gold hover:bg-gold-dark"
            disabled={verifying}
          >
            <Link href="/dashboard">{t("goToDashboard")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
