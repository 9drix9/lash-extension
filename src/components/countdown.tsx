"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: Date | string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const now = new Date().getTime();
  const distance = target.getTime() - now;

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

export function Countdown({ targetDate, className }: CountdownProps) {
  const t = useTranslations("live");
  const target =
    typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(target)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isExpired) {
    return null;
  }

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("hours") },
    { value: timeLeft.minutes, label: t("minutes") },
    { value: timeLeft.seconds, label: t("seconds") },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex flex-col items-center justify-center",
              "min-w-[3.5rem] rounded-lg border bg-background px-2 py-2",
              "shadow-sm"
            )}
          >
            <span className="text-xl font-bold tabular-nums text-foreground">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {unit.label}
            </span>
          </div>

          {/* Separator colon between units (except after the last) */}
          {index < units.length - 1 && (
            <span className="text-lg font-bold text-muted-foreground/50">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
