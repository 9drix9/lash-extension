"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { enrollInCourse } from "@/lib/actions/enrollment";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface EnrollButtonProps {
  courseId: string;
  isSignedIn: boolean;
  label: string;
}

export function EnrollButton({ courseId, isSignedIn, label }: EnrollButtonProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  async function handleEnroll() {
    if (!isSignedIn) {
      signIn(undefined, { callbackUrl: "/enroll" });
      return;
    }

    setIsLoading(true);

    try {
      const result = await enrollInCourse(courseId);

      if (result.alreadyEnrolled) {
        router.push("/dashboard");
        return;
      }

      if (result.enrolled) {
        toast.success(t("welcomeEnrolled"));
        router.push("/dashboard");
      }
    } catch {
      toast.error(t("tryAgain"));
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={isLoading}
      className="h-12 w-full gap-2 rounded-lg bg-gold text-base font-semibold text-white shadow-lg shadow-gold/25 transition-all hover:bg-gold-dark hover:shadow-xl hover:shadow-gold/30"
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
