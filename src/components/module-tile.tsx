"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, Check, Star, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleTileProps {
  module: {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string | null;
    order: number;
    isBonus: boolean;
    isPremiumOnly?: boolean;
  };
  status: "LOCKED" | "UNLOCKED" | "COMPLETED";
  quizPassed: boolean;
  isVipLocked?: boolean;
}

export function ModuleTile({ module, status, quizPassed, isVipLocked }: ModuleTileProps) {
  const t = useTranslations("dashboard");
  const tPayment = useTranslations("payment");

  const isLocked = status === "LOCKED";
  const isCompleted = status === "COMPLETED";
  const isUnlocked = status === "UNLOCKED";

  const content = (
    <div
      className={cn(
        "module-tile group relative flex h-64 flex-col overflow-hidden rounded-xl",
        isLocked && "module-locked grayscale opacity-60"
      )}
    >
      {/* Background image or gradient placeholder */}
      {module.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${module.imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gold-dark via-gold to-gold-light" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Module number badge (top-left) */}
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full",
              "bg-white/20 text-xs font-bold text-white backdrop-blur-sm"
            )}
          >
            {module.order}
          </span>

          {/* Bonus badge */}
          {module.isBonus && !module.isPremiumOnly && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
                "bg-gold/90 text-xs font-semibold text-white backdrop-blur-sm"
              )}
            >
              <Star className="h-3 w-3" />
              {t("bonus")}
            </span>
          )}

          {/* VIP badge for premium-only modules */}
          {module.isPremiumOnly && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
                "bg-gold/90 text-xs font-semibold text-white backdrop-blur-sm"
              )}
            >
              <Crown className="h-3 w-3" />
              VIP
            </span>
          )}
        </div>
      </div>

      {/* Title and subtitle */}
      <div className="relative z-10 mt-auto p-4">
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-light" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-tight text-white">
              {module.title}
            </h3>
            {module.subtitle && (
              <p className="mt-1 line-clamp-1 text-sm text-white/70">
                {module.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2">
          {isLocked && isVipLocked && (
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-gold/80" />
              <span className="text-xs text-gold/80 font-medium">
                {tPayment("vipRequired")}
              </span>
            </div>
          )}

          {isLocked && !isVipLocked && (
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs text-white/60">
                {t("completePrevious")}
              </span>
            </div>
          )}

          {isUnlocked && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5",
                "bg-gold/90 text-xs font-semibold text-white"
              )}
            >
              {t("unlocked")}
            </span>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
                  "bg-green-500/90 text-xs font-semibold text-white"
                )}
              >
                <Check className="h-3 w-3" />
                {t("completed")}
              </span>

              {quizPassed && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5",
                    "bg-green-600/80 text-xs font-medium text-white"
                  )}
                >
                  {t("quizPassed")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link
      href={`/module/${module.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded-xl"
    >
      {content}
    </Link>
  );
}
