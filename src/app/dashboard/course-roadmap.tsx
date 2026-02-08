"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Lock, Star, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModuleData {
  id: string;
  title: string;
  order: number;
  isBonus: boolean;
  status: "LOCKED" | "UNLOCKED" | "COMPLETED";
}

interface CourseRoadmapProps {
  modules: ModuleData[];
}

export function CourseRoadmap({ modules }: CourseRoadmapProps) {
  const t = useTranslations("dashboard");

  const required = modules
    .filter((m) => !m.isBonus)
    .sort((a, b) => a.order - b.order);
  const bonus = modules.filter((m) => m.isBonus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gold" />
          {t("courseRoadmap")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Required modules timeline */}
        <div className="roadmap-scroll overflow-x-auto pb-3">
          <div className="flex items-start gap-0 min-w-max px-2">
            {required.map((mod, i) => {
              const isClickable =
                mod.status === "UNLOCKED" || mod.status === "COMPLETED";

              const step = (
                <div
                  className={cn(
                    "roadmap-step flex flex-col items-center",
                    "w-20 sm:w-24"
                  )}
                >
                  {/* Status circle */}
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all",
                      mod.status === "COMPLETED" &&
                        "border-green-500 bg-green-500 text-white",
                      mod.status === "UNLOCKED" &&
                        "border-gold bg-gold/10 roadmap-current",
                      mod.status === "LOCKED" &&
                        "border-gray-200 bg-gray-100 text-gray-400"
                    )}
                  >
                    {mod.status === "COMPLETED" ? (
                      <Check className="h-5 w-5" />
                    ) : mod.status === "UNLOCKED" ? (
                      <span className="h-3 w-3 rounded-full bg-gold" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>

                  {/* Module info */}
                  <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                    {t("moduleNumber", { number: mod.order })}
                  </p>
                  <p
                    className={cn(
                      "text-xs text-center leading-tight mt-0.5 line-clamp-2",
                      mod.status === "LOCKED"
                        ? "text-muted-foreground/50"
                        : "text-foreground"
                    )}
                  >
                    {mod.title}
                  </p>
                  {mod.status === "UNLOCKED" && (
                    <span className="mt-1 text-[10px] font-semibold text-gold uppercase">
                      {t("currentModule")}
                    </span>
                  )}
                </div>
              );

              return (
                <div key={mod.id} className="flex items-start">
                  {/* Connector line (before all except first) */}
                  {i > 0 && (
                    <div className="flex items-center h-11 mx-0.5">
                      <div
                        className={cn(
                          "h-0.5 w-6 sm:w-8",
                          required[i - 1].status === "COMPLETED" &&
                            mod.status === "COMPLETED"
                            ? "bg-green-500"
                            : required[i - 1].status === "COMPLETED" &&
                                mod.status === "UNLOCKED"
                              ? "bg-gradient-to-r from-green-500 to-gold"
                              : "bg-gray-200"
                        )}
                      />
                    </div>
                  )}

                  {isClickable ? (
                    <Link href={`/module/${mod.id}`}>{step}</Link>
                  ) : (
                    <div className="cursor-not-allowed">{step}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus modules */}
        {bonus.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-gold" />
              {t("bonusModules")}
            </p>
            <div className="flex flex-wrap gap-2">
              {bonus.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/module/${mod.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    mod.status === "COMPLETED"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gold/30 bg-gold/5 text-foreground hover:bg-gold/10"
                  )}
                >
                  {mod.status === "COMPLETED" && (
                    <Check className="h-3 w-3" />
                  )}
                  {mod.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
