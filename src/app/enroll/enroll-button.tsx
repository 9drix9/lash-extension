"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CheckoutButtonProps {
  courseId: string;
  isSignedIn: boolean;
  tier: "BASIC" | "STANDARD" | "PREMIUM";
  label: string;
  variant?: "default" | "outline" | "premium";
}

export function CheckoutButton({
  courseId,
  isSignedIn,
  tier,
  label,
  variant = "default",
}: CheckoutButtonProps) {
  const t = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    if (!isSignedIn) {
      signIn(undefined, { callbackUrl: "/enroll" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(t("tryAgain"));
      setIsLoading(false);
    }
  }

  const baseClass =
    variant === "premium"
      ? "h-12 w-full gap-2 rounded-lg bg-gold text-base font-semibold text-white shadow-lg shadow-gold/25 transition-all hover:bg-gold-dark hover:shadow-xl hover:shadow-gold/30"
      : variant === "default"
      ? "h-12 w-full gap-2 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl"
      : "h-12 w-full gap-2 rounded-lg border-2 border-border text-base font-semibold transition-all hover:bg-muted/50";

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={baseClass}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("processing")}
        </>
      ) : (
        <>
          {isSignedIn ? label : t("signInToEnroll")}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
