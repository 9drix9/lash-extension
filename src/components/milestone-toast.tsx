"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface MilestoneData {
  title: string;
  message: string;
  badgeEmoji: string;
  nextStep?: string;
}

interface MilestoneToastProps {
  milestone: MilestoneData;
  onClose: () => void;
}

export function MilestoneToast({ milestone, onClose }: MilestoneToastProps) {
  const t = useTranslations("common");
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md",
          "-translate-x-1/2 -translate-y-1/2",
          "animate-fade-in"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={milestone.title}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border bg-background shadow-2xl",
            "border-gold/30"
          )}
        >
          {/* Gold accent line at top */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-dark via-gold to-gold-light" />

          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute right-3 top-4 rounded-full p-1",
              "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
            {/* Badge emoji */}
            <div
              className={cn(
                "mb-4 flex h-20 w-20 items-center justify-center",
                "rounded-full bg-gold/10 text-5xl"
              )}
            >
              {milestone.badgeEmoji}
            </div>

            {/* Title */}
            <h2 className="mb-2 font-display text-xl font-bold text-foreground">
              {milestone.title}
            </h2>

            {/* Message */}
            <p className="mb-4 text-sm text-muted-foreground">
              {milestone.message}
            </p>

            {/* Next step recommendation */}
            {milestone.nextStep && (
              <div
                className={cn(
                  "mb-4 w-full rounded-lg border border-gold/20 bg-gold/5 p-3"
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">
                  {t("nextStep")}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {milestone.nextStep}
                </p>
              </div>
            )}

            {/* Close action */}
            <Button
              onClick={onClose}
              className="bg-gold text-white hover:bg-gold-dark"
            >
              {t("continue")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
